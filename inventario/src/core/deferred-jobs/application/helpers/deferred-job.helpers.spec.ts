import { DeferredJobSpec, PermanentJobError, ScheduledJobInfo } from '../../domain';
import { DeferredJobHandlerRegistry } from '../deferred-job-handler.registry';
import {
  buildDeferredJobId,
  delayUntil,
  planReconcile,
  runDeferredJob,
} from './deferred-job.helpers';

const T = new Date('2026-03-10T20:00:00.000Z');
const at = (min: number) => new Date(T.getTime() + min * 60_000);

const spec = (key: string, runAt: Date): DeferredJobSpec => ({
  namespace: 'ns',
  scope: 'ALTACENTRO',
  key,
  runAt,
  payload: { key },
});
const info = (
  key: string,
  runAt: Date,
  state: ScheduledJobInfo['state'] = 'delayed',
): ScheduledJobInfo => ({ namespace: 'ns', scope: 'ALTACENTRO', key, runAt, state });

describe('buildDeferredJobId', () => {
  it('es determinista y no contiene ":" (BullMQ lo rechaza)', () => {
    const id = buildDeferredJobId('flota.vencimiento', 'ALTACENTRO', 'DOTACION-1', T);
    expect(id).toBe(buildDeferredJobId('flota.vencimiento', 'ALTACENTRO', 'DOTACION-1', T));
    expect(id).not.toContain(':');
  });

  it('cambia con el plazo: el job viejo nunca colisiona con el nuevo', () => {
    expect(buildDeferredJobId('n', 's', 'k', at(0))).not.toBe(buildDeferredJobId('n', 's', 'k', at(5)));
  });

  it('no colisiona entre tenants ni entre entidades', () => {
    expect(buildDeferredJobId('n', 'A', 'k', T)).not.toBe(buildDeferredJobId('n', 'B', 'k', T));
    expect(buildDeferredJobId('n', 'A', 'k1', T)).not.toBe(buildDeferredJobId('n', 'A', 'k2', T));
  });

  it('sanea caracteres no permitidos', () => {
    expect(buildDeferredJobId('a:b', 's c', 'k/1', T)).toMatch(/^[A-Za-z0-9._-]+$/);
  });
});

describe('delayUntil', () => {
  it('devuelve la diferencia en el futuro', () => {
    expect(delayUntil(at(1), T.getTime())).toBe(60_000);
  });
  it('un plazo ya vencido se procesa lo antes posible: demora 0', () => {
    expect(delayUntil(at(-30), T.getTime())).toBe(0);
  });
});

describe('planReconcile', () => {
  it('programa lo faltante', () => {
    const plan = planReconcile([], [spec('a', at(10))]);
    expect(plan.toSchedule.map(s => s.key)).toEqual(['a']);
    expect(plan.toCancel).toEqual([]);
    expect(plan.unchanged).toBe(0);
  });

  it('no duplica lo ya programado con el mismo plazo', () => {
    const plan = planReconcile([info('a', at(10))], [spec('a', at(10))]);
    expect(plan.toSchedule).toEqual([]);
    expect(plan.toCancel).toEqual([]);
    expect(plan.unchanged).toBe(1);
  });

  it('un cambio de plazo programa el nuevo y cancela el viejo', () => {
    const plan = planReconcile([info('a', at(10))], [spec('a', at(40))]);
    expect(plan.toSchedule.map(s => s.runAt.getTime())).toEqual([at(40).getTime()]);
    expect(plan.toCancel.map(c => c.runAt.getTime())).toEqual([at(10).getTime()]);
  });

  it('cancela jobs huérfanos (ya no hay plazo pendiente en SQL)', () => {
    const plan = planReconcile([info('gone', at(10))], []);
    expect(plan.toCancel.map(c => c.key)).toEqual(['gone']);
  });

  it('nunca cancela un job activo (su revalidación lo vuelve no-op)', () => {
    const plan = planReconcile([info('a', at(10), 'active')], [spec('a', at(40))]);
    expect(plan.toCancel).toEqual([]);
    expect(plan.toSchedule).toHaveLength(1);
  });

  it('es idempotente: aplicar el resultado deseado deja un plan vacío', () => {
    const desired = [spec('a', at(10)), spec('b', at(20))];
    const plan = planReconcile(
      desired.map(d => info(d.key, d.runAt)),
      desired,
    );
    expect(plan.toSchedule).toEqual([]);
    expect(plan.toCancel).toEqual([]);
    expect(plan.unchanged).toBe(2);
  });
});

describe('runDeferredJob', () => {
  const data = { namespace: 'ns', scope: 'S', key: 'k', runAtMs: T.getTime(), payload: { x: 1 } };

  it('entrega al handler el job con intento y máximo de intentos', async () => {
    const registry = new DeferredJobHandlerRegistry();
    const handle = jest.fn().mockResolvedValue(undefined);
    registry.register({ namespace: 'ns', handle });

    await runDeferredJob(registry, data, 2, 5);

    expect(handle).toHaveBeenCalledWith({
      namespace: 'ns',
      scope: 'S',
      key: 'k',
      runAt: T,
      payload: { x: 1 },
      attempt: 2,
      maxAttempts: 5,
    });
  });

  it('propaga errores del handler tal cual (transitorios → BullMQ reintenta)', async () => {
    const registry = new DeferredJobHandlerRegistry();
    registry.register({ namespace: 'ns', handle: jest.fn().mockRejectedValue(new Error('SQL caído')) });
    await expect(runDeferredJob(registry, data, 1, 5)).rejects.toThrow('SQL caído');
  });

  it('propaga PermanentJobError para que el adaptador lo marque como no reintentable', async () => {
    const registry = new DeferredJobHandlerRegistry();
    registry.register({
      namespace: 'ns',
      handle: jest.fn().mockRejectedValue(new PermanentJobError('payload inválido')),
    });
    await expect(runDeferredJob(registry, data, 1, 5)).rejects.toBeInstanceOf(PermanentJobError);
  });

  it('un job sin namespace es permanente', async () => {
    const registry = new DeferredJobHandlerRegistry();
    await expect(
      runDeferredJob(registry, { ...data, namespace: '' }, 1, 5),
    ).rejects.toBeInstanceOf(PermanentJobError);
  });

  it('sin handler registrado el error es transitorio (puede ser un despliegue en curso)', async () => {
    const registry = new DeferredJobHandlerRegistry();
    const promise = runDeferredJob(registry, data, 1, 5);
    await expect(promise).rejects.toThrow(/No hay handler/);
    await expect(promise).rejects.not.toBeInstanceOf(PermanentJobError);
  });

  it('el registro rechaza handlers duplicados por namespace', () => {
    const registry = new DeferredJobHandlerRegistry();
    registry.register({ namespace: 'ns', handle: jest.fn() });
    expect(() => registry.register({ namespace: 'ns', handle: jest.fn() })).toThrow();
  });
});
