import { DeferredJobExecution } from '../deferred-job.types';

/**
 * Handler de un namespace. Contiene (o delega) la lógica de negocio: el scheduler solo
 * invoca `handle` y clasifica el error resultante (`PermanentJobError` = no reintentar).
 * Debe ser idempotente: puede ejecutarse más de una vez para el mismo job.
 */
export interface DeferredJobHandler<P = unknown> {
  readonly namespace: string;
  handle(execution: DeferredJobExecution<P>): Promise<void>;
}
