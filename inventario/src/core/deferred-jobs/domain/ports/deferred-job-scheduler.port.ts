import {
  DeferredJobSpec,
  FailedJobInfo,
  ReconcileResult,
  ScheduledJobInfo,
} from '../deferred-job.types';

/**
 * Puerto de programación de jobs diferidos.
 *
 * El almacén de jobs NO es la fuente de verdad: lo es el módulo de negocio que lo usa.
 * El scheduler solo materializa "ejecuta esto a esta hora". Un fallo del backend se
 * propaga como error para que el consumidor decida; no hay atomicidad con la base de
 * datos del negocio, la consistencia se recupera con `reconcile`.
 */
export interface DeferredJobScheduler {
  /**
   * Programa (o reemplaza) el job lógico `namespace/scope/key` para `runAt`.
   * Idempotente: si ya existe el mismo job con el mismo `runAt`, no hace nada.
   * Si `runAt` ya pasó, se ejecuta lo antes posible, sin demora artificial.
   */
  schedule(spec: DeferredJobSpec): Promise<void>;

  /** Retira los jobs pendientes (no activos) de la clave lógica. Devuelve cuántos retiró. */
  cancel(namespace: string, scope: string, key: string): Promise<number>;

  /** Lista los jobs pendientes o activos de un namespace (opcionalmente de un scope). */
  listScheduled(namespace: string, scope?: string): Promise<ScheduledJobInfo[]>;

  /**
   * Hace coincidir los jobs pendientes del `scope` con el conjunto deseado: programa los
   * faltantes o con `runAt` distinto y retira los que ya no están deseados.
   */
  reconcile(namespace: string, scope: string, desired: DeferredJobSpec[]): Promise<ReconcileResult>;

  /** Jobs que agotaron reintentos o fallaron de forma permanente (retenidos para inspección). */
  listFailed(namespace: string, limit?: number): Promise<FailedJobInfo[]>;

  /** Devuelve un job fallido a la cola para un nuevo ciclo de intentos. */
  retryFailed(jobId: string): Promise<void>;

  /**
   * Toma y ejecuta los jobs debidos del tenant actual. El adaptador SQL lo usa como
   * worker; BullMQ lo deja en no-op (su Worker ya consume la cola).
   */
  processDue(now?: Date): Promise<number>;
}
