import { ResourceNotFoundError } from '@common/domain/errors';
import {
  AMBULANCIA_FLOTA_REPOSITORY,
  AmbulanciaFlotaRepository,
  ENTREGA_DECL_FLOTA_REPOSITORY,
  ENTREGA_FLOTA_REPOSITORY,
  EntregaDeclFlotaRepository,
  EntregaFlotaRepository,
  PLANTILLA_FLOTA_REPOSITORY,
  PlantillaFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import {
  DeclaracionView,
  EntregaResumenRead,
  EntregaView,
  TurnoView,
} from '@inn/operaciones/turnos-vehiculos/domain/read';
import {
  EstadoDeclaracion,
  EstadoEntrega,
  EstadoTurno,
  RolDeclaracion,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { flattenPlantillaEstructura, resolveNoAplicaAcuerdo } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import { countPendientesEntrega } from '@inn/operaciones/turnos-vehiculos/domain/policies/declaracion-modalidad.policy';
import { PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { getUser } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import { UsuarioEqpService } from '@inn/core/identity/application/services/usuario-eqp.service';
import { VehiculosService } from '@inn/operaciones/tanqueos/application';

@Injectable()
export class FlotaViewBuilderService {
  constructor(
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(ENTREGA_FLOTA_REPOSITORY) private readonly entregaRepo: EntregaFlotaRepository,
    @Inject(ENTREGA_DECL_FLOTA_REPOSITORY) private readonly declRepo: EntregaDeclFlotaRepository,
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    @Inject(AMBULANCIA_FLOTA_REPOSITORY) private readonly ambRepo: AmbulanciaFlotaRepository,
    private readonly vehiculoService: VehiculosService,
    private readonly usuarioService: UsuarioEqpService,
  ) {}

  async buildTurnoView(turnoId: number): Promise<TurnoView> {
    const turno = await this.turnoRepo.findById(turnoId);
    if (!turno) throw new ResourceNotFoundError(`Turno ${turnoId} no encontrado`);
    const entrega = await this.entregaRepo.findByTurnoSaliente(turnoId);
    if (!entrega) throw new ResourceNotFoundError('Entrega del turno no encontrada');
    const vehiculo = await this.vehiculoService.findById(turno.getVehiculoId.getValor);
    const amb = await this.ambRepo.findByVehiculoId(turno.getVehiculoId.getValor);
    const responsable = await this.usuarioService.findById(turno.getResponsableId.getValor);
    const entregaResumen = await this.buildEntregaResumen(entrega.getId.getValor);
    return {
      id: turno.getId.getValor,
      estado: turno.getEstado,
      origen: turno.getOrigen,
      causaCierre: turno.getCausaCierre,
      fechaInicio: turno.getFechaInicio,
      fechaFin: turno.getFechaFin,
      ambulancia: {
        id: amb?.getId.getValor,
        vehiculoId: turno.getVehiculoId.getValor,
        placa: vehiculo?.getPlaca,
        codigo: vehiculo?.getPlaca,
        tipoAmbulancia: amb?.getTipoAmbulancia as any,
        estadoServicio: amb?.getEstadoServicio as any,
      },
      responsable: { id: responsable.id, nombre: (responsable as any).nombreCompleto ?? '' },
      entrega: entregaResumen,
    };
  }

  async buildEntregaResumen(entregaId: number): Promise<EntregaResumenRead> {
    const entrega = await this.entregaRepo.findById(entregaId);
    if (!entrega) throw new ResourceNotFoundError(`Entrega ${entregaId} no encontrada`);
    const decls = await this.declRepo.findByEntregaId(entregaId);
    const declEntrega = decls.find(d => d.getRol === RolDeclaracion.ENTREGA);
    const declRecep = decls.find(d => d.getRol === RolDeclaracion.RECEPCION);
    const usuario = getUser();
    const turno = await this.turnoRepo.findById(entrega.getTurnoSalienteId.getValor);
    const now = new Date();
    const esOtro = !!turno && turno.getResponsableId.getValor !== usuario.id;
    const acciones = {
      puedeLanzar:
        !!turno &&
        turno.getEstado === EstadoTurno.ACTIVO &&
        entrega.getEstado === EstadoEntrega.ABIERTA &&
        !entrega.getFechaEntrega &&
        turno.getResponsableId.getValor === usuario.id &&
        now.getTime() < entrega.getCierreAutomaticoEn.getTime(),
      puedeRecibir: esOtro && entrega.puedeRecibirNormal(now) && !!declEntrega,
      puedeRecibirExcepcional: esOtro && entrega.puedeRecibirExcepcional(now),
    };
    let lanzadaPorAdministracion;
    if (entrega.getLanzadaPorId) {
      const admin = await this.usuarioService.findById(entrega.getLanzadaPorId.getValor);
      if (admin) {
        lanzadaPorAdministracion = { id: admin.id, nombre: (admin as any).nombreCompleto ?? '' };
      }
    }
    return {
      id: entrega.getId.getValor,
      estado: entrega.getEstado,
      causaCierre: entrega.getCausaCierre,
      fechaEntrega: entrega.getFechaEntrega,
      limiteInicioRecepcion: entrega.getLimiteInicioRecepcion,
      habilitaExcepcionalEn: entrega.getHabilitaExcepcionalEn,
      cierreAutomaticoEn: entrega.getCierreAutomaticoEn,
      entrega: declEntrega ? await this.declResumen(declEntrega) : null,
      recepcion: declRecep ? await this.declResumen(declRecep) : null,
      acciones,
      lanzadaPorAdministracion,
    };
  }

  async buildEntregaView(entregaId: number): Promise<EntregaView> {
    const resumen = await this.buildEntregaResumen(entregaId);
    const entrega = await this.entregaRepo.findById(entregaId);
    const plantilla = await this.plantillaRepo.findById(entrega.getPlantillaId.getValor);
    const estructura = plantilla.getEstructura as PlantillaEstructuraJson;
    const decls = await this.declRepo.findByEntregaId(entregaId);
    const declEntrega = decls.find(d => d.getRol === RolDeclaracion.ENTREGA);
    const declRecep = decls.find(d => d.getRol === RolDeclaracion.RECEPCION);
    const items = flattenPlantillaEstructura(estructura).map(flat => {
      const ie = declEntrega?.getDatos.items.find(i => i.key === flat.key);
      const ir = declRecep?.getDatos.items.find(i => i.key === flat.key);
      return {
        key: flat.key,
        texto: flat.texto,
        categoria: flat.categoria,
        orden: flat.orden,
        entrega: ie
          ? { respuesta: String(ie.respuesta), observacion: ie.observacion, evidencias: ie.evidencias }
          : null,
        recepcion: ir
          ? { respuesta: String(ir.respuesta), observacion: ir.observacion, evidencias: ir.evidencias }
          : null,
        noAplica: resolveNoAplicaAcuerdo(ie?.respuesta as string, ir?.respuesta as string),
      };
    });
    return {
      ...resumen,
      vehiculoId: entrega.getVehiculoId.getValor,
      turnoSalienteId: entrega.getTurnoSalienteId.getValor,
      turnoEntranteId: entrega.getTurnoEntranteId?.getValor,
      items,
    };
  }

  async buildDeclaracionView(entregaId: number, rol: RolDeclaracion): Promise<DeclaracionView> {
    const decl = await this.declRepo.findByEntregaAndRol(entregaId, rol);
    if (!decl) throw new ResourceNotFoundError('Declaración no encontrada');
    const entrega = await this.entregaRepo.findById(entregaId);
    const plantilla = await this.plantillaRepo.findById(entrega.getPlantillaId.getValor);
    const estructura = plantilla.getEstructura as PlantillaEstructuraJson;
    const usuario = await this.usuarioService.findById(decl.getUsuarioId.getValor);
    const items = flattenPlantillaEstructura(estructura).map(flat => {
      const i = decl.getDatos.items.find(x => x.key === flat.key);
      return {
        key: flat.key,
        texto: flat.texto,
        categoria: flat.categoria,
        orden: flat.orden,
        respuesta: String(i?.respuesta ?? 'SIN_REPORTAR'),
        observacion: i?.observacion,
        evidencias: i?.evidencias,
      };
    });
    return {
      id: decl.getId.getValor,
      rol: decl.getRol,
      usuario: { id: usuario.id, nombre: (usuario as any).nombreCompleto ?? '' },
      estado: decl.getEstado,
      modalidad: decl.getModalidad,
      causaCierre: decl.getCausaCierre,
      limiteEdicion: decl.getLimiteEdicion,
      fechaCierre: decl.getFechaCierre,
      pendientes: countPendientesEntrega(decl.getDatos.items),
      items,
    };
  }

  private async declResumen(decl: import('@inn/operaciones/turnos-vehiculos/domain/entities').EntregaDeclaracion) {
    const usuario = await this.usuarioService.findById(decl.getUsuarioId.getValor);
    return {
      id: decl.getId.getValor,
      usuario: { id: usuario.id, nombre: (usuario as any).nombreCompleto ?? '' },
      estado: decl.getEstado,
      modalidad: decl.getModalidad,
      limiteEdicion: decl.getLimiteEdicion,
      fechaCierre: decl.getFechaCierre,
    };
  }
}
