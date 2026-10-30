import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { DotacionFlota, EntregaDeclaracion, EntregaFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import {
  CausaCierreDeclaracion,
  CausaCierreEntrega,
  CausaCierreLimpieza,
  CausaCierreTurno,
  EntidadEventoFlota,
  EstadoDeclaracion,
  EstadoEntrega,
  EstadoLimpieza,
  EstadoDotacion,
  EstadoTurno,
  RolDeclaracion,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { fechaNegocioBogota } from '@inn/operaciones/turnos-vehiculos/domain/helpers/bogota-time.helper';
import {
  DOTACION_FLOTA_REPOSITORY,
  DotacionFlotaRepository,
  ENTREGA_DECL_FLOTA_REPOSITORY,
  ENTREGA_FLOTA_REPOSITORY,
  EntregaDeclFlotaRepository,
  EntregaFlotaRepository,
  LIMPIEZA_FLOTA_REPOSITORY,
  LimpiezaFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
  VENCIMIENTO_FLOTA_QUERY,
  VencimientoFlotaQuery,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { DotacionNovedadSyncService } from '../helpers/dotacion-novedad-sync.service';
import { AmbEventoService } from './amb-evento.service';

@Injectable()
export class VencimientoService {
  constructor(
    @Inject(VENCIMIENTO_FLOTA_QUERY) private readonly vencimientoQuery: VencimientoFlotaQuery,
    @Inject(DOTACION_FLOTA_REPOSITORY) private readonly dotacionRepo: DotacionFlotaRepository,
    @Inject(ENTREGA_FLOTA_REPOSITORY) private readonly entregaRepo: EntregaFlotaRepository,
    @Inject(ENTREGA_DECL_FLOTA_REPOSITORY) private readonly declRepo: EntregaDeclFlotaRepository,
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(LIMPIEZA_FLOTA_REPOSITORY) private readonly limpiezaRepo: LimpiezaFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly eventoService: AmbEventoService,
    private readonly novedadSync: DotacionNovedadSyncService,
  ) {}

  async resolverTodosVencidos(now = new Date()): Promise<void> {
    const rows = await this.vencimientoQuery.findVencidos(now);
    for (const row of rows) {
      await this.resolverFila(row, now);
    }
  }

  async resolverFila(
    row: { tipo: string; entidadId: number },
    now = new Date(),
  ): Promise<void> {
    await this.txManager.transactional(async () => {
      switch (row.tipo) {
        case 'DOTACION':
          await this.resolverDotacion(row.entidadId, now);
          break;
        case 'ENTREGA_DECL':
          await this.resolverDeclaracion(row.entidadId, now);
          break;
        case 'ENTREGA_RECEPCION':
          await this.resolverAusenciaReceptor(row.entidadId, now);
          break;
        case 'ENTREGA_CIERRE':
          await this.resolverSinActividad(row.entidadId, now);
          break;
      }
    });
  }

  // Cada resolver usa doble verificación: una lectura rápida sin bloqueo (camino habitual de
  // las lecturas de usuario) y, solo si hay trabajo, una transacción que bloquea la fila y
  // vuelve a evaluar. Así un job y una petición concurrente no cierran dos veces ni duplican
  // el evento de auditoría: el segundo ve el estado ya resuelto y no hace nada.

  private async resolverDotacion(dotacionId: number, now: Date): Promise<void> {
    const pendiente = (d: DotacionFlota | null) =>
      !!d &&
      !d.getBloqueada &&
      d.getEstado === EstadoDotacion.EN_CURSO &&
      !!d.getFechaLimite &&
      now.getTime() >= d.getFechaLimite.getTime();
    if (!pendiente(await this.dotacionRepo.findById(dotacionId))) return;

    await this.txManager.transactional(async () => {
      await this.vencimientoQuery.bloquear('DOTACION', dotacionId);
      const dot = await this.dotacionRepo.findById(dotacionId);
      if (!pendiente(dot)) return;
      const resultado = dot.aplicarVencimiento(now);
      if (resultado === 'ELIMINAR') {
        const iniciadaPor = dot.getUsuarioId?.getValor;
        const fechaInicio = dot.getFechaInicio;
        const vehiculoId = dot.getVehiculoId.getValor;
        await this.dotacionRepo.delete(dotacionId);
        await this.eventoService.registrar({
          entidad: EntidadEventoFlota.DOTACION,
          entidadId: dotacionId,
          tipoEvento: 'VENCIMIENTO_DOTACION',
          vehiculoId,
          detalle: { resultado: 'VACIA_ELIMINADA', iniciadaPor, fechaInicio },
        });
        return;
      }
      if (resultado === 'OMITIR') return;
      await this.dotacionRepo.update(dot);
      await this.novedadSync.sincronizar(dot, now);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.DOTACION,
        entidadId: dotacionId,
        tipoEvento: 'VENCIMIENTO_DOTACION',
        vehiculoId: dot.getVehiculoId.getValor,
      });
    });
  }

  private async resolverDeclaracion(declId: number, now: Date): Promise<void> {
    const pendiente = (d: EntregaDeclaracion | null) =>
      !!d &&
      d.getEstado === EstadoDeclaracion.EN_EDICION &&
      !!d.getLimiteEdicion &&
      now.getTime() >= d.getLimiteEdicion.getTime();
    if (!pendiente(await this.declRepo.findById(declId))) return;

    await this.txManager.transactional(async () => {
      await this.vencimientoQuery.bloquear('ENTREGA_DECL', declId);
      const decl = await this.declRepo.findById(declId);
      if (!pendiente(decl)) return;
      decl.cerrarAutomatico(CausaCierreDeclaracion.VENCIMIENTO, now);
      await this.declRepo.update(decl);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGADECL,
        entidadId: declId,
        tipoEvento: 'VENCIMIENTO_DECLARACION',
      });
    });
  }

  private async resolverAusenciaReceptor(entregaId: number, now: Date): Promise<void> {
    const pendiente = (e: EntregaFlota | null) =>
      !!e &&
      e.getEstado === EstadoEntrega.ABIERTA &&
      !!e.getFechaEntrega &&
      !e.getTurnoEntranteId &&
      !!e.getLimiteInicioRecepcion &&
      now.getTime() >= e.getLimiteInicioRecepcion.getTime();
    if (!pendiente(await this.entregaRepo.findById(entregaId))) return;

    await this.txManager.transactional(async () => {
      await this.vencimientoQuery.bloquear('ENTREGA_RECEPCION', entregaId);
      const entrega = await this.entregaRepo.findById(entregaId);
      if (!pendiente(entrega)) return;
      entrega.cerrar(CausaCierreEntrega.AUSENCIA_RECEPTOR, now);
      await this.entregaRepo.update(entrega);
      await this.cerrarTurnoYLimpieza(
        entrega.getTurnoSalienteId.getValor,
        CausaCierreTurno.AUSENCIA_RECEPTOR,
        CausaCierreLimpieza.VENCIMIENTO,
        now,
      );
      await this.cerrarDeclaracionEntregaAbierta(entregaId, now);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGA,
        entidadId: entregaId,
        tipoEvento: 'AUSENCIA_RECEPTOR',
        vehiculoId: entrega.getVehiculoId.getValor,
      });
    });
  }

  private async resolverSinActividad(entregaId: number, now: Date): Promise<void> {
    const pendiente = (e: EntregaFlota | null) =>
      !!e &&
      e.getEstado === EstadoEntrega.ABIERTA &&
      !e.getFechaEntrega &&
      !e.getTurnoEntranteId &&
      now.getTime() >= e.getCierreAutomaticoEn.getTime();
    if (!pendiente(await this.entregaRepo.findById(entregaId))) return;

    await this.txManager.transactional(async () => {
      await this.vencimientoQuery.bloquear('ENTREGA_CIERRE', entregaId);
      const entrega = await this.entregaRepo.findById(entregaId);
      if (!pendiente(entrega)) return;
      entrega.cerrar(CausaCierreEntrega.SIN_ACTIVIDAD, now);
      await this.entregaRepo.update(entrega);
      await this.cerrarTurnoYLimpieza(
        entrega.getTurnoSalienteId.getValor,
        CausaCierreTurno.SIN_ACTIVIDAD,
        CausaCierreLimpieza.VENCIMIENTO,
        now,
      );
      await this.cerrarDeclaracionEntregaAbierta(entregaId, now);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGA,
        entidadId: entregaId,
        tipoEvento: 'SIN_ACTIVIDAD',
        vehiculoId: entrega.getVehiculoId.getValor,
      });
    });
  }

  private async cerrarDeclaracionEntregaAbierta(entregaId: number, now: Date): Promise<void> {
    const actual = await this.declRepo.findByEntregaAndRol(entregaId, RolDeclaracion.ENTREGA);
    if (!actual) return;
    await this.declRepo.bloquear(actual.getId.getValor);
    const declEntrega = await this.declRepo.findById(actual.getId.getValor);
    if (declEntrega && declEntrega.getEstado === EstadoDeclaracion.EN_EDICION) {
      declEntrega.cerrarAutomatico(CausaCierreDeclaracion.CIERRE_PROCESO, now);
      await this.declRepo.update(declEntrega);
    }
  }

  async cerrarTurnoYLimpieza(
    turnoId: number,
    causa: CausaCierreTurno,
    causaLimpieza: CausaCierreLimpieza,
    now: Date,
  ): Promise<void> {
    const turno = await this.turnoRepo.findById(turnoId);
    if (!turno) return;
    if (turno.getEstado !== EstadoTurno.CERRADO) {
      turno.cerrar(causa);
      await this.turnoRepo.update(turno);
    }
    await this.resolverBorradoresLimpieza(turnoId, causaLimpieza, now);
  }

  async resolverBorradoresLimpieza(
    turnoId: number,
    causa: CausaCierreLimpieza,
    now: Date,
  ): Promise<void> {
    const limpiezas = await this.limpiezaRepo.findByTurno(turnoId);
    for (const l of limpiezas.filter(x => x.getEstado === EstadoLimpieza.BORRADOR)) {
      if (l.esVacia()) {
        await this.limpiezaRepo.delete(l.getId.getValor);
        await this.eventoService.registrar({
          entidad: EntidadEventoFlota.LIMPIEZA,
          entidadId: l.getId.getValor,
          tipoEvento: 'LIMPIEZA_DESCARTADA',
          vehiculoId: l.getVehiculoId.getValor,
          detalle: { motivo: causa === CausaCierreLimpieza.CIERRE_ADMIN ? 'CIERRE_ADMIN' : 'VENCIMIENTO' },
        });
      } else {
        l.cerrarBorradorConContenido(causa, now);
        await this.limpiezaRepo.update(l);
      }
    }
  }

  async ensureResolvedBeforeUse(
    scope: { dotacionId?: number; entregaId?: number; declId?: number },
    now = new Date(),
  ): Promise<void> {
    if (scope.dotacionId) await this.resolverDotacion(scope.dotacionId, now);
    if (scope.declId) await this.resolverDeclaracion(scope.declId, now);
    if (scope.entregaId) {
      await this.resolverAusenciaReceptor(scope.entregaId, now);
      await this.resolverSinActividad(scope.entregaId, now);
    }
  }

  async resolverAntesTablero(now = new Date()): Promise<void> {
    const turnos = await this.turnoRepo.findActivos();
    for (const t of turnos) {
      const entrega = await this.entregaRepo.findByTurnoSaliente(t.getId.getValor);
      if (entrega) await this.ensureResolvedBeforeUse({ entregaId: entrega.getId.getValor }, now);
    }
    const hoy = fechaNegocioBogota(now);
    const dotacionesHoy = await this.dotacionRepo.findByFecha(hoy);
    for (const d of dotacionesHoy) {
      if (d.getEstado === EstadoDotacion.EN_CURSO) {
        await this.resolverDotacion(d.getId.getValor, now);
      }
    }
  }

  async resolverDotacionesEnCursoEnRango(desde: string, hasta: string, now = new Date()): Promise<void> {
    const dotaciones = await this.dotacionRepo.findEnCursoVencidasEnRango(desde, hasta, now);
    for (const d of dotaciones) {
      await this.resolverDotacion(d.getId.getValor, now);
    }
  }
}
