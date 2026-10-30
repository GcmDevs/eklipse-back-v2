import { DeferredJobHandlerRegistry } from '../application/deferred-job-handler.registry';
import { DeferredJobExecution, PermanentJobError } from '../domain';
import { BullMqDeferredJobScheduler } from './bullmq-deferred-job.scheduler';

/**
 * Integración contra un Redis REAL. Se omite salvo que se pida explícitamente:
 *
 *   REDIS_INTEGRATION=1 REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npx jest bullmq-deferred-job.scheduler.redis.integration
 *
 * Usa un prefijo aleatorio por ejecución para no tocar jobs reales. Cubre lo que los tests
 * unitarios no pueden: disparo real en el plazo, reemplazo/cancelación, reintentos con
 * backoff y errores permanentes.
 */
const enabled = process.env.REDIS_INTEGRATION === '1';
const maybe = enabled ? describe : describe.skip;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const waitFor = async (cond: () => boolean, timeoutMs: number) => {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error('timeout esperando condición');
    await sleep(50);
  }
};

maybe('BullMqDeferredJobScheduler (Redis real)', () => {
  let scheduler: BullMqDeferredJobScheduler;
  let registry: DeferredJobHandlerRegistry;
  const executions: DeferredJobExecution[] = [];
  let behavior: (e: DeferredJobExecution) => Promise<void> = async () => undefined;

  beforeAll(() => {
    process.env.DEFERRED_JOBS_PREFIX = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    registry = new DeferredJobHandlerRegistry();
    registry.register({
      namespace: 'it',
      handle: async e => {
        executions.push(e);
        await behavior(e);
      },
    });
    scheduler = new BullMqDeferredJobScheduler(registry);
    scheduler.onApplicationBootstrap();
  });

  afterAll(async () => {
    await scheduler.onApplicationShutdown();
  });

  beforeEach(() => {
    executions.length = 0;
    behavior = async () => undefined;
  });

  const spec = (key: string, inMs: number, payload: unknown = {}) => ({
    namespace: 'it',
    scope: 'T',
    key,
    runAt: new Date(Date.now() + inMs),
    payload,
  });

  it('ejecuta el job una sola vez en el plazo y no antes', async () => {
    await scheduler.schedule(spec('a', 1_500));
    await sleep(700);
    expect(executions).toHaveLength(0);
    await waitFor(() => executions.length > 0, 5_000);
    await sleep(500);
    expect(executions.filter(e => e.key === 'a')).toHaveLength(1);
  }, 15_000);

  it('un plazo ya vencido se ejecuta de inmediato', async () => {
    await scheduler.schedule(spec('past', -60_000));
    await waitFor(() => executions.some(e => e.key === 'past'), 3_000);
  }, 10_000);

  it('reprogramar cambia el plazo: el job viejo no dispara', async () => {
    await scheduler.schedule(spec('b', 1_500));
    await scheduler.schedule(spec('b', 3_000));
    await sleep(2_200);
    expect(executions.filter(e => e.key === 'b')).toHaveLength(0);
    await waitFor(() => executions.some(e => e.key === 'b'), 5_000);
    expect(executions.filter(e => e.key === 'b')).toHaveLength(1);
  }, 15_000);

  it('cancelar evita la ejecución', async () => {
    await scheduler.schedule(spec('c', 1_500));
    expect(await scheduler.cancel('it', 'T', 'c')).toBe(1);
    await sleep(2_500);
    expect(executions.filter(e => e.key === 'c')).toHaveLength(0);
  }, 10_000);

  it('reconcile programa faltantes y retira huérfanos, sin duplicar', async () => {
    await scheduler.schedule(spec('orphan', 30_000));
    const keep = spec('keep', 30_000);
    const first = await scheduler.reconcile('it', 'T', [keep]);
    expect(first.scheduled).toBe(1);
    expect(first.cancelled).toBe(1);
    const second = await scheduler.reconcile('it', 'T', [keep]);
    expect(second).toEqual({ scheduled: 0, cancelled: 0, unchanged: 1 });
    await scheduler.cancel('it', 'T', 'keep');
  }, 10_000);

  it('un error transitorio se reintenta con backoff y luego termina bien', async () => {
    behavior = async e => {
      if (e.attempt < 2) throw new Error('transitorio');
    };
    await scheduler.schedule(spec('retry', 0));
    await waitFor(() => executions.filter(e => e.key === 'retry').length >= 2, 20_000);
    expect(executions.filter(e => e.key === 'retry').map(e => e.attempt)).toEqual([1, 2]);
  }, 30_000);

  it('un error permanente no se reintenta y queda para inspección', async () => {
    behavior = async () => {
      throw new PermanentJobError('payload inválido');
    };
    await scheduler.schedule(spec('perm', 0));
    await waitFor(() => executions.some(e => e.key === 'perm'), 5_000);
    await sleep(1_000);
    expect(executions.filter(e => e.key === 'perm')).toHaveLength(1);
    const failed = await scheduler.listFailed('it');
    expect(failed.some(f => f.key === 'perm')).toBe(true);
  }, 15_000);
});
