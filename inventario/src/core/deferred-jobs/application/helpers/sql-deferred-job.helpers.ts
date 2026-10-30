import { DeferredJobRowStatus } from '../../domain';

export const SQL_JOB_MAX_ATTEMPTS = 5;
export const SQL_JOB_BACKOFF_MS = 5_000;
export const SQL_JOB_COMPLETED_RETENTION_MS = 60 * 60 * 1000;
export const SQL_JOB_FAILED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const SQL_JOB_CLAIM_BATCH = 50;

export const nextRetryAt = (
  attempts: number,
  now = new Date(),
  backoffMs = SQL_JOB_BACKOFF_MS,
): Date => new Date(now.getTime() + backoffMs * 2 ** Math.max(0, attempts - 1));

export const isDue = (status: DeferredJobRowStatus, nextTryAt: Date, now: Date): boolean =>
  status === 'PENDING' && nextTryAt.getTime() <= now.getTime();

export type JobOutcome = 'COMPLETED' | 'FAILED' | 'RETRY';

export const decideJobOutcome = (
  error: Error | null,
  attempts: number,
  maxAttempts: number,
  permanent: boolean,
): JobOutcome => {
  if (!error) return 'COMPLETED';
  if (permanent || attempts >= maxAttempts) return 'FAILED';
  return 'RETRY';
};

export const completedRetentionCutoff = (now = new Date()): Date =>
  new Date(now.getTime() - SQL_JOB_COMPLETED_RETENTION_MS);

export const failedRetentionCutoff = (now = new Date()): Date =>
  new Date(now.getTime() - SQL_JOB_FAILED_RETENTION_MS);
