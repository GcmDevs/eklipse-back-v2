import { ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { EstadoDeclaracion, EstadoTurno, OrigenTurno, RolDeclaracion } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { fechaNegocioBogota } from '@inn/operaciones/turnos-vehiculos/domain/helpers/bogota-time.helper';
import { estadoDeclaracionVisible, estadoLimpiezaVisible } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import { MiTurnoEtapa, MiTurnoItemView, MiTurnoView, TurnoDetalleView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import {
  ENTREGA_DECL_FLOTA_REPOSITORY,
  ENTREGA_FLOTA_REPOSITORY,
  EntregaDeclFlotaRepository,
  EntregaFlotaRepository,
  LIMPIEZA_FLOTA_REPOSITORY,
  LimpiezaFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { UsuarioEqpService } from '@inn/core/identity/application/services/usuario-eqp.service';
import { FlotaViewBuilderService } from '../helpers/flota-view-builder.service';
import { LimpiezaService } from './limpieza.service';

@Injectable()
export class MiTurnoService {
  constructor(
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(ENTREGA_FLOTA_REPOSITORY) private readonly entregaRepo: EntregaFlotaRepository,
    @Inject(ENTREGA_DECL_FLOTA_REPOSITORY) private readonly declRepo: EntregaDeclFlotaRepository,
    @Inject(LIMPIEZA_FLOTA_REPOSITORY) private readonly limpiezaRepo: LimpiezaFlotaRepository,
    private readonly viewBuilder: FlotaViewBuilderService,
    private readonly limpiezaService: LimpiezaService,
    private readonly usuarioService: UsuarioEqpService,
  ) {}

  async obtener(): Promise<MiTurnoView> {
    const usuario = getUser();
    const now = new Date();
    const fecha = fechaNegocioBogota(now);
    const candidatos = await this.turnoRepo.findMiTurno(usuario.id);
    const turnos: MiTurnoItemView[] = [];
    for (const t of candidatos) {
      const item = await this.buildDetalle(t.getId.getValor);
      if (t.getEstado === EstadoTurno.CERRADO && item.etapa !== 'CERRADO_CON_PENDIENTES') continue;
      turnos.push(item);
    }
    const disponibles = await this.entregaRepo.findDisponiblesParaRecibir(usuario.id, now);
    const entregasDisponibles = [];
    for (const e of disponibles) {
      entregasDisponibles.push(await this.viewBuilder.buildTurnoView(e.getTurnoSalienteId.getValor));
    }
    return { fecha, turnos, entregasDisponibles };
  }

  async detalleTurno(id: number): Promise<TurnoDetalleView> {
    const turno = await this.turnoRepo.findById(id);
    if (!turno) throw new ResourceNotFoundError(`Turno ${id} no encontrado`);
    return this.buildDetalle(id);
  }

  private async buildDetalle(turnoId: number): Promise<TurnoDetalleView> {
    const turno = await this.viewBuilder.buildTurnoView(turnoId);
    const entregaSaliente = await this.viewBuilder.buildEntregaView(turno.entrega.id);
    const limpiezasRaw = await this.limpiezaRepo.findByTurno(turnoId);
    const limpiezas = [];
    for (const l of limpiezasRaw) limpiezas.push(await this.limpiezaService.getById(l.getId.getValor));

    const domainTurno = await this.turnoRepo.findById(turnoId);
    let recepcionEntrante = null;
    if (
      domainTurno.getOrigen === OrigenTurno.RECEPCION ||
      domainTurno.getOrigen === OrigenTurno.RECEPCION_EXCEPCIONAL
    ) {
      const prev = await this.entregaRepo.findByTurnoEntrante(turnoId);
      if (prev) recepcionEntrante = await this.viewBuilder.buildEntregaView(prev.getId.getValor);
    }

    const declEntrega = await this.declRepo.findByEntregaAndRol(turno.entrega.id, RolDeclaracion.ENTREGA);
    const declRecep = recepcionEntrante
      ? await this.declRepo.findByEntregaAndRol(recepcionEntrante.id, RolDeclaracion.RECEPCION)
      : null;

    let receptor = null;
    if (entregaSaliente.turnoEntranteId) {
      const entrante = await this.turnoRepo.findById(entregaSaliente.turnoEntranteId);
      if (entrante) {
        const u = await this.usuarioService.findById(entrante.getResponsableId.getValor);
        receptor = { id: u.id, nombre: (u as any).nombreCompleto ?? '' };
      }
    }

    let etapa: MiTurnoEtapa = 'OPERANDO';
    if (turno.estado === EstadoTurno.ENTREGADO) etapa = 'ENTREGADO_ESPERANDO_RECEPTOR';
    if (turno.estado === EstadoTurno.CERRADO && declEntrega?.getEstado === EstadoDeclaracion.EN_EDICION) {
      etapa = 'CERRADO_CON_PENDIENTES';
    }

    return {
      turno,
      etapa,
      receptor,
      entregaSaliente,
      recepcionEntrante,
      limpiezas,
      formularios: {
        entrega: estadoDeclaracionVisible(
          declEntrega
            ? {
                existe: true,
                estado: declEntrega.getEstado,
                modalidad: declEntrega.getModalidad,
                causaCierre: declEntrega.getCausaCierre,
              }
            : { existe: false },
        ),
        recepcion: estadoDeclaracionVisible(
          declRecep
            ? {
                existe: true,
                estado: declRecep.getEstado,
                modalidad: declRecep.getModalidad,
                causaCierre: declRecep.getCausaCierre,
              }
            : null,
        ),
        limpieza: estadoLimpiezaVisible(
          limpiezasRaw.map(l => ({ estado: l.getEstado, causaCierre: l.getCausaCierre })),
        ),
      },
    };
  }
}
