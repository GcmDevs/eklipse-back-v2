import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { getUser } from '@common/infrastructure/services';
import {
  DEFERRED_JOB_SCHEDULER,
  DeferredJobScheduler,
  DeferredJobSpec,
  PermanentJobError,
  ReconcileResult,
} from '@inn/core/deferred-jobs/domain';
import {
  DecisionVencimientoJob,
  TIPOS_VENCIMIENTO_FLOTA,
  TipoVencimientoFlota,
  VENCIMIENTO_JOB_NAMESPACE,
  decidirVencimientoJob,
  vencimientoJobKey,
} from '@inn/operaciones/turnos-vehiculos/domain/policies';
import {
  ProximoVencimientoRow,
  VENCIMIENTO_FLOTA_QUERY,
  VencimientoFlotaQuery,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { VencimientoService } from './vencimiento.service';

export interface VencimientoJobPayload {
  tipo: TipoVencimientoFlota;
  entidadId: number;
  /** Plazo (ISO) con el que se programó el job; se contrasta con el vigente en SQL. */
  fechaLimite: string;
}

/** Transitorio: el job despertó antes del plazo (deriva de relojes). Se reintenta con backoff. */
export class VencimientoAunNoVenceError extends Error {
  constructor() {
    super('El plazo aún no se cumple según SQL Server');
    this.name = 'VencimientoAunNoVenceError';
  }
}

/**
 * Punto único de integración entre los plazos de Flota y los jobs diferidos del core.
 *
 * SQL Server es la fuente de verdad del plazo. Los jobs son una proyección derivada: se
 * recalculan siempre a partir del estado SQL (`sincronizar`), nunca se mantienen "a mano".
 * Esta clase no habla con SQL ni con BullMQ: solo conoce el puerto `DeferredJobScheduler`.
 */
@Injectable()
export class VencimientoProgramacionService {
  private readonly logger = new Logger(VencimientoProgramacionService.name);

  constructor(
    @Inject(VENCIMIENTO_FLOTA_QUERY) private readonly vencimientoQuery: VencimientoFlotaQuery,
    @Inject(DEFERRED_JOB_SCHEDULER) private readonly scheduler: DeferredJobScheduler,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly vencimientoService: VencimientoService,
  ) {}

  /**
   * Para llamar DESPUÉS de confirmar una operación que crea, cambia o cancela un plazo.
   * No lanza: la operación de negocio ya está confirmada y un fallo del backend de jobs
   * no debe convertirla en error. Si esto falla, la reconciliación y la evaluación
   * perezosa lo reparan.
   */
  async sincronizar(now = new Date()): Promise<void> {
    try {
      await this.reconciliarJobs(now);
    } catch (error) {
      this.logger.warn(
        `No se pudo sincronizar jobs de vencimiento (se reparará en la reconciliación): ${(error as Error).message}`,
      );
    }
  }

  /**
   * Recuperación completa del tenant actual: resuelve lo ya vencido y deja los jobs
   * alineados con lo pendiente.
   */
  async recuperarTenant(now = new Date()): Promise<ReconcileResult> {
    await this.vencimientoService.resolverTodosVencidos(now);
    return this.reconciliarJobs(now);
  }

  /** Toma y ejecuta los jobs cuyo plazo ya llegó en el tenant actual. */
  async procesarVencidosProgramados(now = new Date()): Promise<number> {
    return this.scheduler.processDue(now);
  }

  /** Hace coincidir los jobs del tenant con los plazos pendientes en SQL. */
  async reconciliarJobs(now = new Date()): Promise<ReconcileResult> {
    const scope = getUser().context.getCode();
    const pendientes = await this.vencimientoQuery.findPendientes();
    return this.scheduler.reconcile(
      VENCIMIENTO_JOB_NAMESPACE,
      scope,
      pendientes.map(row => this.toSpec(scope, row)),
    );
  }

  /**
   * Procesa un job que despertó. Relee SQL bajo bloqueo y solo actúa si el registro sigue
   * pendiente con el MISMO plazo del job. Idempotente: reintentos o jobs duplicados no
   * cierran dos veces ni repiten auditoría/notificación.
   */
  async procesarJob(
    payload: VencimientoJobPayload,
    now = new Date(),
  ): Promise<DecisionVencimientoJob> {
    const esperada = new Date(payload?.fechaLimite);
    if (
      !TIPOS_VENCIMIENTO_FLOTA.includes(payload?.tipo) ||
      !Number.isInteger(payload?.entidadId) ||
      Number.isNaN(esperada.getTime())
    ) {
      throw new PermanentJobError('Payload de vencimiento inválido');
    }

    const decision = await this.txManager.transactional(async () => {
      await this.vencimientoQuery.bloquear(payload.tipo, payload.entidadId);
      const plazo = await this.vencimientoQuery.findPlazoActual(payload.tipo, payload.entidadId);
      const decision = decidirVencimientoJob({
        pendiente: plazo.pendiente,
        fechaLimiteActual: plazo.fechaLimite,
        fechaLimiteEsperada: esperada,
        now,
      });
      if (decision === 'EJECUTAR') {
        await this.vencimientoService.resolverFila(
          { tipo: payload.tipo, entidadId: payload.entidadId },
          now,
        );
      }
      return decision;
    });

    if (decision === 'REINTENTAR_AUN_NO_VENCE') throw new VencimientoAunNoVenceError();
    return decision;
  }

  private toSpec(scope: string, row: ProximoVencimientoRow): DeferredJobSpec<VencimientoJobPayload> {
    return {
      namespace: VENCIMIENTO_JOB_NAMESPACE,
      scope,
      key: vencimientoJobKey(row.tipo, row.entidadId),
      runAt: row.fechaLimite,
      payload: {
        tipo: row.tipo,
        entidadId: row.entidadId,
        fechaLimite: row.fechaLimite.toISOString(),
      },
    };
  }
}
