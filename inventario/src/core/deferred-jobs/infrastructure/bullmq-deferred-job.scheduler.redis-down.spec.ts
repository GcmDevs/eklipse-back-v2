import { DeferredJobHandlerRegistry } from '../application/deferred-job-handler.registry';
import { BullMqDeferredJobScheduler } from './bullmq-deferred-job.scheduler';

/**
 * Comportamiento con Redis NO disponible (puerto sin servicio). No requiere Redis real:
 * verifica que el arranque no se rompe y que programar falla rápido (sin colgar la
 * petición de negocio), que es lo que habilita la reconciliación posterior.
 */
describe('BullMqDeferredJobScheduler con Redis caído', () => {
  const originalEnv = { ...process.env };
  let scheduler: BullMqDeferredJobScheduler;

  beforeAll(() => {
    process.env.REDIS_HOST = '127.0.0.1';
    process.env.REDIS_PORT = '6399';
    process.env.DEFERRED_JOBS_ENABLED = 'true';
    scheduler = new BullMqDeferredJobScheduler(new DeferredJobHandlerRegistry());
    scheduler.onApplicationBootstrap();
  });

  afterAll(async () => {
    // El cierre está acotado en tiempo aunque Redis no responda.
    await scheduler.onApplicationShutdown();
    process.env = originalEnv;
  }, 20_000);

  it('el arranque no lanza aunque Redis no responda', () => {
    expect(scheduler).toBeDefined();
  });

  it('schedule rechaza rápido en lugar de quedarse esperando a Redis', async () => {
    const started = Date.now();
    await expect(
      scheduler.schedule({
        namespace: 'ns',
        scope: 'S',
        key: 'k',
        runAt: new Date(Date.now() + 60_000),
        payload: {},
      }),
    ).rejects.toBeDefined();
    expect(Date.now() - started).toBeLessThan(5_000);
  }, 15_000);

  it('reconcile también falla de forma explícita (el consumidor decide cómo reaccionar)', async () => {
    await expect(scheduler.reconcile('ns', 'S', [])).rejects.toBeDefined();
  }, 15_000);
});

describe('BullMqDeferredJobScheduler desactivado', () => {
  it('con DEFERRED_JOBS_ENABLED=false no crea cola y schedule informa que no está disponible', async () => {
    const previous = process.env.DEFERRED_JOBS_ENABLED;
    process.env.DEFERRED_JOBS_ENABLED = 'false';
    const scheduler = new BullMqDeferredJobScheduler(new DeferredJobHandlerRegistry());
    scheduler.onApplicationBootstrap();
    await expect(
      scheduler.schedule({ namespace: 'ns', scope: 'S', key: 'k', runAt: new Date(), payload: {} }),
    ).rejects.toThrow(/no disponibles/);
    process.env.DEFERRED_JOBS_ENABLED = previous;
  });
});
