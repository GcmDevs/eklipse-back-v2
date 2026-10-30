import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { fetchAuthsByUser, getUser } from '@common/infrastructure/services';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { INN_AUTHORITIES } from '@inn/authorities';
import {
  CausaCierreDeclaracion,
  CausaCierreEntrega,
  CausaCierreLimpieza,
  CausaCierreTurno,
  EntidadEventoFlota,
  EstadoDeclaracion,
  EstadoLimpieza,
  EstadoTurno,
  PLAZO_EXTENSION_MAX_MINUTOS,
  RecursoPlazoFlota,
  RolDeclaracion,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import {
  DOTACION_FLOTA_REPOSITORY,
  DotacionFlotaRepository,
  ENTREGA_DECL_FLOTA_REPOSITORY,
  ENTREGA_FLOTA_REPOSITORY,
  EntregaDeclFlotaRepository,
  EntregaFlotaRepository,
  LIMPIEZA_FLOTA_REPOSITORY,
  LimpiezaFlotaRepository,
  PLANTILLA_FLOTA_REPOSITORY,
  PlantillaFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { seedEntregaItemsFromPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import { EntregaDeclaracion, TurnoFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { AmbEventoService } from './amb-evento.service';
import { VencimientoService } from './vencimiento.service';
import { VencimientoProgramacionService } from './vencimiento-programacion.service';
import { FlotaViewBuilderService } from '../helpers/flota-view-builder.service';

@Injectable()
export class FlotaAdminService {
  constructor(
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(ENTREGA_FLOTA_REPOSITORY) private readonly entregaRepo: EntregaFlotaRepository,
    @Inject(ENTREGA_DECL_FLOTA_REPOSITORY) private readonly declRepo: EntregaDeclFlotaRepository,
    @Inject(LIMPIEZA_FLOTA_REPOSITORY) private readonly limpiezaRepo: LimpiezaFlotaRepository,
    @Inject(DOTACION_FLOTA_REPOSITORY) private readonly dotacionRepo: DotacionFlotaRepository,
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly vencimientoService: VencimientoService,
    private readonly programacion: VencimientoProgramacionService,
    private readonly eventoService: AmbEventoService,
    private readonly viewBuilder: FlotaViewBuilderService,
  ) {}

  async lanzarEnNombre(turnoId: number, motivo: string) {
    this.assertMotivo(motivo);
    const admin = getUser();
    const now = new Date();
    const turno = await this.turnoRepo.findById(turnoId);
    if (!turno) throw new ResourceNotFoundError('Turno no encontrado');
    turno.assertActivo();
    const entrega = await this.entregaRepo.findByTurnoSaliente(turnoId);
    if (!entrega) throw new ResourceNotFoundError('Entrega no encontrada');
    if (entrega.getFechaEntrega) throw new BadInputError('La entrega ya fue lanzada');
    await this.vencimientoService.ensureResolvedBeforeUse({ entregaId: entrega.getId.getValor }, now);
    await this.txManager.transactional(async () => {
      await this.vencimientoService.resolverBorradoresLimpieza(
        turnoId,
        CausaCierreLimpieza.CIERRE_ADMIN,
        now,
      );
      const plantilla = await this.plantillaRepo.findById(entrega.getPlantillaId.getValor);
      if (!plantilla) throw new ResourceNotFoundError('Plantilla de entrega no encontrada');
      const datos = { items: seedEntregaItemsFromPlantilla(plantilla.getEstructura as PlantillaEstructuraJson) };
      entrega.lanzarEntrega(now, admin.id);
      await this.entregaRepo.update(entrega);
      const decl = EntregaDeclaracion.createEntrega(entrega.getId.getValor, turno.getResponsableId.getValor, datos);
      await this.declRepo.save(decl);
      turno.marcarEntregado();
      await this.turnoRepo.update(turno);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGA,
        entidadId: entrega.getId.getValor,
        tipoEvento: 'ENTREGA_LANZADA_ADMIN',
        usuarioId: admin.id,
        motivo,
        vehiculoId: turno.getVehiculoId.getValor,
        detalle: { via: 'ADMINISTRACION', enNombreDe: turno.getResponsableId.getValor },
      });
    });
    await this.programacion.sincronizar(now);
    return this.viewBuilder.buildEntregaView(entrega.getId.getValor);
  }

  async extenderPlazo(recurso: RecursoPlazoFlota, id: number, minutos: number, motivo: string) {
    this.assertMotivo(motivo);
    if (!minutos || minutos < 1 || minutos > PLAZO_EXTENSION_MAX_MINUTOS) {
      throw new BadInputError(`minutos debe estar entre 1 y ${PLAZO_EXTENSION_MAX_MINUTOS}`);
    }
    const admin = getUser();
    const now = new Date();
    let nuevo: Date;
    let anterior: Date | undefined;
    await this.txManager.transactional(async () => {
      if (recurso === RecursoPlazoFlota.DOTACION) {
        const dot = await this.dotacionRepo.findById(id);
        if (!dot) throw new ResourceNotFoundError('Dotación no encontrada');
        anterior = dot.getFechaLimite;
        nuevo = dot.extenderPlazo(minutos, now);
        await this.dotacionRepo.update(dot);
      } else if (recurso === RecursoPlazoFlota.DECLARACION) {
        const decl = await this.declRepo.findById(id);
        if (!decl) throw new ResourceNotFoundError('Declaración no encontrada');
        anterior = decl.getLimiteEdicion;
        nuevo = decl.extenderPlazo(minutos, now);
        await this.declRepo.update(decl);
      } else {
        const entrega = await this.entregaRepo.findById(id);
        if (!entrega) throw new ResourceNotFoundError('Entrega no encontrada');
        anterior = entrega.getLimiteInicioRecepcion ?? entrega.getCierreAutomaticoEn;
        nuevo = entrega.extenderPlazo(minutos, now);
        await this.entregaRepo.update(entrega);
      }
      await this.eventoService.registrar({
        entidad:
          recurso === RecursoPlazoFlota.DOTACION
            ? EntidadEventoFlota.DOTACION
            : recurso === RecursoPlazoFlota.DECLARACION
              ? EntidadEventoFlota.ENTREGADECL
              : EntidadEventoFlota.ENTREGA,
        entidadId: id,
        tipoEvento: 'PLAZO_EXTENDIDO',
        usuarioId: admin.id,
        motivo,
        detalle: { via: 'ADMINISTRACION', anterior, nuevo, minutos },
      });
    });
    await this.programacion.sincronizar(now);
    return { id, recurso, nuevoLimite: nuevo };
  }

  async transferir(turnoId: number, nuevoResponsableId: number, motivo: string) {
    this.assertMotivo(motivo);
    const admin = getUser();
    const now = new Date();
    const turno = await this.turnoRepo.findById(turnoId);
    if (!turno) throw new ResourceNotFoundError('Turno no encontrado');
    await this.assertOperar(nuevoResponsableId);
    const turnoVigente = await this.turnoRepo.findVigenteByResponsable(nuevoResponsableId);
    if (turnoVigente && turnoVigente.getId.getValor !== turnoId) {
      const vigenteView = await this.viewBuilder.buildTurnoView(turnoVigente.getId.getValor);
      const ambulancia =
        vigenteView.ambulancia.placa ?? vigenteView.ambulancia.codigo ?? String(turnoVigente.getVehiculoId.getValor);
      TurnoFlota.assertSinTurnoVigente(
        turnoVigente,
        'El usuario ya tiene un turno abierto en la ambulancia ' + ambulancia,
      );
    }
    const anterior = turno.getResponsableId.getValor;
    await this.txManager.transactional(async () => {
      turno.transferir(nuevoResponsableId, now);
      await this.turnoRepo.update(turno);
      const limpiezas = await this.limpiezaRepo.findByTurno(turnoId);
      for (const l of limpiezas.filter(x => x.getEstado === EstadoLimpieza.BORRADOR)) {
        l.reasignar(nuevoResponsableId, now);
        await this.limpiezaRepo.update(l);
      }
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.TURNO,
        entidadId: turnoId,
        tipoEvento: 'TURNO_TRANSFERIDO',
        usuarioId: admin.id,
        motivo,
        vehiculoId: turno.getVehiculoId.getValor,
        detalle: { via: 'ADMINISTRACION', anterior, nuevo: nuevoResponsableId },
      });
    });
    return this.viewBuilder.buildTurnoView(turnoId);
  }

  async cerrarTurno(turnoId: number, motivo: string) {
    this.assertMotivo(motivo);
    const admin = getUser();
    const now = new Date();
    const turno = await this.turnoRepo.findById(turnoId);
    if (!turno) throw new ResourceNotFoundError('Turno no encontrado');
    if (turno.getEstado !== EstadoTurno.ACTIVO && turno.getEstado !== EstadoTurno.ENTREGADO) {
      throw new BadInputError('Solo se cierra un turno ACTIVO o ENTREGADO');
    }
    await this.txManager.transactional(async () => {
      const entrega = await this.entregaRepo.findByTurnoSaliente(turnoId);
      if (entrega) {
        entrega.cerrar(CausaCierreEntrega.CIERRE_ADMIN, now);
        await this.entregaRepo.update(entrega);
        const decls = await this.declRepo.findByEntregaId(entrega.getId.getValor);
        for (const d of decls.filter(x => x.getEstado === EstadoDeclaracion.EN_EDICION)) {
          d.cerrarAutomatico(CausaCierreDeclaracion.CIERRE_PROCESO, now);
          await this.declRepo.update(d);
        }
      }
      await this.vencimientoService.cerrarTurnoYLimpieza(
        turnoId,
        CausaCierreTurno.CIERRE_ADMIN,
        CausaCierreLimpieza.CIERRE_ADMIN,
        now,
      );
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.TURNO,
        entidadId: turnoId,
        tipoEvento: 'TURNO_CERRADO_ADMIN',
        usuarioId: admin.id,
        motivo,
        vehiculoId: turno.getVehiculoId.getValor,
        detalle: { via: 'ADMINISTRACION' },
      });
    });
    await this.programacion.sincronizar(now);
    return this.viewBuilder.buildTurnoView(turnoId);
  }

  private assertMotivo(motivo: string): void {
    if (!motivo?.trim()) throw new BadInputError('El motivo es obligatorio');
  }

  private async assertOperar(usuarioId: number): Promise<void> {
    const ctx = getUser().context;
    const auths = await fetchAuthsByUser({ id: usuarioId, ctx });
    const codes: string[] = auths.onlyCodes ?? [];
    if (!codes.includes(INN_AUTHORITIES.GESTION_FLOTA.OPERAR) && !codes.includes(ADMIN_AUTHORITY)) {
      throw new BadInputError('El nuevo responsable debe tener permiso OPERAR');
    }
  }
}
