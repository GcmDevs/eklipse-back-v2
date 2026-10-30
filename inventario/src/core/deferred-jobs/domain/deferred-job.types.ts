/**
 * Contratos genéricos de jobs diferidos. No conocen ningún módulo de negocio ni BullMQ.
 *
 * - `namespace`: familia de jobs (ej. 'flota.vencimiento'). Selecciona el handler.
 * - `scope`: agrupador opcional dentro del namespace (ej. el tenant). `reconcile` solo
 *   toca los jobs de su propio scope.
 * - `key`: identidad lógica del job dentro del scope (ej. 'DOTACION-12').
 * - `runAt`: instante exacto de ejecución. Forma parte de la identidad física del job,
 *   por eso cambiar `runAt` produce un job nuevo y retira el anterior.
 */
export interface DeferredJobSpec<P = unknown> {
  namespace: string;
  scope: string;
  key: string;
  runAt: Date;
  payload: P;
}

export interface DeferredJobExecution<P = unknown> {
  namespace: string;
  scope: string;
  key: string;
  runAt: Date;
  payload: P;
  /** Intento actual, comenzando en 1. */
  attempt: number;
  maxAttempts: number;
}

export type ScheduledJobState = 'delayed' | 'waiting' | 'active';

/** Estados persistidos por el adaptador SQL (BullMQ usa los suyos). */
export type DeferredJobRowStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface ScheduledJobInfo {
  namespace: string;
  scope: string;
  key: string;
  runAt: Date;
  state: ScheduledJobState;
}

export interface FailedJobInfo {
  id: string;
  namespace: string;
  scope: string;
  key: string;
  runAt: Date;
  attempts: number;
  reason: string;
  failedAt: Date | null;
}

export interface ReconcileResult {
  scheduled: number;
  cancelled: number;
  unchanged: number;
}
