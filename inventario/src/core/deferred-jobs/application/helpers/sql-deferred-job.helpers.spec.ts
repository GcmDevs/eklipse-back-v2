import {
  decideJobOutcome,
  isDue,
  nextRetryAt,
  SQL_JOB_BACKOFF_MS,
} from './sql-deferred-job.helpers';

describe('sql-deferred-job.helpers', () => {
  const now = new Date('2026-03-10T08:00:00.000Z');

  it('isDue solo para PENDING cuyo nextTryAt ya pasó', () => {
    expect(isDue('PENDING', now, now)).toBe(true);
    expect(isDue('PENDING', new Date(now.getTime() + 1), now)).toBe(false);
    expect(isDue('ACTIVE', now, now)).toBe(false);
    expect(isDue('FAILED', now, now)).toBe(false);
  });

  it('nextRetryAt crece en exponencial 5s, 10s, 20s…', () => {
    expect(nextRetryAt(1, now).getTime() - now.getTime()).toBe(SQL_JOB_BACKOFF_MS);
    expect(nextRetryAt(2, now).getTime() - now.getTime()).toBe(SQL_JOB_BACKOFF_MS * 2);
    expect(nextRetryAt(3, now).getTime() - now.getTime()).toBe(SQL_JOB_BACKOFF_MS * 4);
  });

  it('decideJobOutcome: éxito, permanente, reintento y agotado', () => {
    expect(decideJobOutcome(null, 1, 5, false)).toBe('COMPLETED');
    expect(decideJobOutcome(new Error('x'), 1, 5, true)).toBe('FAILED');
    expect(decideJobOutcome(new Error('x'), 2, 5, false)).toBe('RETRY');
    expect(decideJobOutcome(new Error('x'), 5, 5, false)).toBe('FAILED');
  });
});
