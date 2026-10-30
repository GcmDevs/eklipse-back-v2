import {
  DeferredJobSpec,
  PermanentJobError,
  ReconcileResult,
  ScheduledJobInfo,
} from '../../domain';
import { DeferredJobHandlerRegistry } from '../deferred-job-handler.registry';

/** Forma persistida en el backend de jobs. Sin dependencias de BullMQ. */
export interface DeferredJobData {
  namespace: string;
  scope: string;
  key: string;
  runAtMs: number;
  payload: unknown;
}

const sanitize = (value: string | number): string => `${value}`.replace(/[^A-Za-z0-9._-]/g, '-');

/**
 * Id físico determinista: namespace + scope + key + instante. Incluir `runAt` garantiza que
 * un cambio de plazo genere un job distinto y que un job activo con el plazo viejo nunca
 * bloquee (por colisión de id) el job con el plazo nuevo. Sin ':' (BullMQ lo rechaza).
 */
export const buildDeferredJobId = (
  namespace: string,
  scope: string,
  key: string,
  runAt: Date,
): string => [namespace, scope, key, runAt.getTime()].map(sanitize).join('__');

export const toJobData = (spec: DeferredJobSpec): DeferredJobData => ({
  namespace: spec.namespace,
  scope: spec.scope,
  key: spec.key,
  runAtMs: spec.runAt.getTime(),
  payload: spec.payload,
});

/** Demora hasta `runAt`. Si ya pasó: 0 (se procesa lo antes posible, sin espera artificial). */
export const delayUntil = (runAt: Date, now = Date.now()): number =>
  Math.max(0, runAt.getTime() - now);

export interface ReconcilePlan {
  toSchedule: DeferredJobSpec[];
  toCancel: ScheduledJobInfo[];
  unchanged: number;
}

/**
 * Diferencia pura entre lo programado y lo deseado. Los jobs activos nunca se cancelan:
 * si ya no son válidos, su re-validación contra la fuente de verdad los vuelve no-op.
 */
export const planReconcile = (
  current: ScheduledJobInfo[],
  desired: DeferredJobSpec[],
): ReconcilePlan => {
  const desiredByKey = new Map(desired.map(d => [d.key, d]));
  const sameRunAt = (c: ScheduledJobInfo, d: DeferredJobSpec) =>
    c.key === d.key && c.runAt.getTime() === d.runAt.getTime();

  const toSchedule = desired.filter(d => !current.some(c => sameRunAt(c, d)));
  const toCancel = current.filter(c => {
    if (c.state === 'active') return false;
    const want = desiredByKey.get(c.key);
    return !want || want.runAt.getTime() !== c.runAt.getTime();
  });
  return { toSchedule, toCancel, unchanged: desired.length - toSchedule.length };
};

export const summarizeReconcile = (plan: ReconcilePlan, cancelled: number): ReconcileResult => ({
  scheduled: plan.toSchedule.length,
  cancelled,
  unchanged: plan.unchanged,
});

/**
 * Ejecuta el handler del namespace. Un `PermanentJobError` (o la ausencia de handler con
 * payload inválido) no se reintenta; cualquier otro error es transitorio.
 */
export const runDeferredJob = async (
  registry: DeferredJobHandlerRegistry,
  data: DeferredJobData,
  attempt: number,
  maxAttempts: number,
): Promise<void> => {
  if (!data?.namespace || !data.key) {
    throw new PermanentJobError('Job sin namespace o key');
  }
  const handler = registry.get(data.namespace);
  if (!handler) {
    throw new Error(`No hay handler registrado para el namespace '${data.namespace}'`);
  }
  await handler.handle({
    namespace: data.namespace,
    scope: data.scope,
    key: data.key,
    runAt: new Date(data.runAtMs),
    payload: data.payload,
    attempt,
    maxAttempts,
  });
};
