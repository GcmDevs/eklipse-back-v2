import { PermanentJobError } from '@inn/core/deferred-jobs/domain';
import {
  DeferredJobSpec,
  ReconcileResult,
  ScheduledJobInfo,
} from '@inn/core/deferred-jobs/domain';
import { planReconcile } from '@inn/core/deferred-jobs/application/helpers/deferred-job.helpers';
import {
  PlazoVencimientoActual,
  ProximoVencimientoRow,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { TipoVencimientoFlota } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import {
  VencimientoAunNoVenceError,
  VencimientoJobPayload,
  VencimientoProgramacionService,
} from './vencimiento-programacion.service';

jest.mock('@common/infrastructure/services', () => ({
  getUser: () => ({ context: { getCode: () => 'ALTACENTRO' } }),
}));

const T0 = new Date('2026-03-10T08:00:00.000Z');
const min = (n: number) => new Date(T0.getTime() + n * 60_000);

/** "SQL Server" en memoria: una fila por (tipo, id) con su plazo y si sigue abierta. */
class FakeSql {
  rows = new Map<string, { tipo: TipoVencimientoFlota; id: number; plazo: Date; abierta: boolean }>();
  eventos: string[] = [];
  private lock: Promise<void> = Promise.resolve();

  put(tipo: TipoVencimientoFlota, id: number, plazo: Date) {
    this.rows.set(`${tipo}-${id}`, { tipo, id, plazo, abierta: true });
  }
  get(tipo: TipoVencimientoFlota, id: number) {
    return this.rows.get(`${tipo}-${id}`)!;
  }

  query() {
    return {
      findVencidos: async (now: Date): Promise<ProximoVencimientoRow[]> =>
        this.pendientes().filter(r => r.fechaLimite.getTime() <= now.getTime()),
      findPendientes: async () => this.pendientes(),
      findPlazoActual: async (tipo: TipoVencimientoFlota, id: number): Promise<PlazoVencimientoActual> => {
        const row = this.rows.get(`${tipo}-${id}`);
        return row?.abierta ? { pendiente: true, fechaLimite: row.plazo } : { pendiente: false, fechaLimite: null };
      },
      // Simula el bloqueo de fila: las transacciones se serializan.
      bloquear: async () => undefined,
    };
  }

  private pendientes(): ProximoVencimientoRow[] {
    return [...this.rows.values()]
      .filter(r => r.abierta)
      .map(r => ({ tipo: r.tipo, entidadId: r.id, fechaLimite: r.plazo }));
  }

  /** Serializa transacciones (equivale al UPDLOCK de la fila en SQL Server). */
  txManager() {
    return {
      transactional: async <T>(work: () => Promise<T>): Promise<T> => {
        const prev = this.lock;
        let release!: () => void;
        this.lock = new Promise<void>(r => (release = r));
        await prev;
        try {
          return await work();
        } finally {
          release();
        }
      },
    };
  }

  /** Replica la semántica de VencimientoService: re-evalúa y cierra una sola vez. */
  vencimientoService() {
    return {
      resolverTodosVencidos: jest.fn(async (now: Date) => {
        for (const r of this.pendientes().filter(p => p.fechaLimite.getTime() <= now.getTime())) {
          await this.resolver(r.tipo, r.entidadId, now);
        }
      }),
      resolverFila: jest.fn(async (row: { tipo: TipoVencimientoFlota; entidadId: number }, now: Date) =>
        this.resolver(row.tipo, row.entidadId, now),
      ),
    };
  }

  private async resolver(tipo: TipoVencimientoFlota, id: number, now: Date) {
    const row = this.rows.get(`${tipo}-${id}`);
    if (!row || !row.abierta || now.getTime() < row.plazo.getTime()) return;
    row.abierta = false;
    this.eventos.push(`VENCIMIENTO-${tipo}-${id}`);
  }
}

/** Scheduler en memoria que usa la misma lógica de plan que el adaptador real. */
class FakeScheduler {
  jobs: ScheduledJobInfo[] = [];
  payloads = new Map<string, VencimientoJobPayload>();
  failing = false;
  reconcileCalls = 0;

  async reconcile(namespace: string, scope: string, desired: DeferredJobSpec[]): Promise<ReconcileResult> {
    this.reconcileCalls++;
    if (this.failing) throw new Error('Backend de jobs caído');
    const current = this.jobs.filter(j => j.namespace === namespace && j.scope === scope);
    const plan = planReconcile(current, desired);
    for (const s of plan.toSchedule) {
      this.jobs.push({ namespace, scope, key: s.key, runAt: s.runAt, state: 'delayed' });
      this.payloads.set(`${s.key}@${s.runAt.getTime()}`, s.payload as VencimientoJobPayload);
    }
    this.jobs = this.jobs.filter(j => !plan.toCancel.includes(j));
    return { scheduled: plan.toSchedule.length, cancelled: plan.toCancel.length, unchanged: plan.unchanged };
  }

  async processDue(): Promise<number> {
    return 0;
  }
}

const build = () => {
  const sql = new FakeSql();
  const scheduler = new FakeScheduler();
  const vencimiento = sql.vencimientoService();
  const service = new VencimientoProgramacionService(
    sql.query() as never,
    scheduler as never,
    sql.txManager() as never,
    vencimiento as never,
  );
  const payloadDe = (tipo: TipoVencimientoFlota, id: number, plazo: Date): VencimientoJobPayload => ({
    tipo,
    entidadId: id,
    fechaLimite: plazo.toISOString(),
  });
  return { sql, scheduler, vencimiento, service, payloadDe };
};

describe('VencimientoProgramacionService', () => {
  describe('sincronizar / reconciliarJobs', () => {
    it('programa un job por plazo pendiente, con el tenant como scope y el plazo como runAt', async () => {
      const { sql, scheduler, service } = build();
      sql.put('DOTACION', 1, min(30));
      sql.put('ENTREGA_CIERRE', 2, min(60));

      await service.sincronizar(T0);

      expect(scheduler.jobs.map(j => [j.scope, j.key, j.runAt.getTime()])).toEqual([
        ['ALTACENTRO', 'DOTACION-1', min(30).getTime()],
        ['ALTACENTRO', 'ENTREGA_CIERRE-2', min(60).getTime()],
      ]);
    });

    it('es idempotente: sincronizar dos veces no duplica jobs', async () => {
      const { sql, scheduler, service } = build();
      sql.put('DOTACION', 1, min(30));
      await service.sincronizar(T0);
      await service.sincronizar(T0);
      expect(scheduler.jobs).toHaveLength(1);
    });

    it('modificar el plazo invalida el job viejo y crea el nuevo', async () => {
      const { sql, scheduler, service } = build();
      sql.put('DOTACION', 1, min(30));
      await service.sincronizar(T0);

      sql.get('DOTACION', 1).plazo = min(90);
      await service.sincronizar(T0);

      expect(scheduler.jobs.map(j => j.runAt.getTime())).toEqual([min(90).getTime()]);
    });

    it('cancela el job cuando el registro deja de estar pendiente', async () => {
      const { sql, scheduler, service } = build();
      sql.put('ENTREGA_DECL', 5, min(30));
      await service.sincronizar(T0);

      sql.get('ENTREGA_DECL', 5).abierta = false;
      await service.sincronizar(T0);

      expect(scheduler.jobs).toHaveLength(0);
    });

    it('un plazo ya vencido también se programa (el core lo ejecuta de inmediato)', async () => {
      const { sql, scheduler, service } = build();
      sql.put('DOTACION', 1, min(-10));
      await service.sincronizar(T0);
      expect(scheduler.jobs).toHaveLength(1);
    });

    it('si el backend de jobs falla, sincronizar NO lanza (la operación de negocio ya fue confirmada)', async () => {
      const { sql, scheduler, service } = build();
      sql.put('DOTACION', 1, min(30));
      scheduler.failing = true;
      await expect(service.sincronizar(T0)).resolves.toBeUndefined();
    });
  });

  describe('procesarJob', () => {
    it('cierra una vez al llegar el plazo', async () => {
      const { sql, vencimiento, service, payloadDe } = build();
      sql.put('DOTACION', 1, min(30));

      const decision = await service.procesarJob(payloadDe('DOTACION', 1, min(30)), min(30));

      expect(decision).toBe('EJECUTAR');
      expect(vencimiento.resolverFila).toHaveBeenCalledTimes(1);
      expect(sql.eventos).toEqual(['VENCIMIENTO-DOTACION-1']);
    });

    it('un job viejo NO cierra un registro cuyo plazo cambió', async () => {
      const { sql, vencimiento, service, payloadDe } = build();
      sql.put('ENTREGA_CIERRE', 2, min(30));
      const viejo = payloadDe('ENTREGA_CIERRE', 2, min(30));
      sql.get('ENTREGA_CIERRE', 2).plazo = min(120);

      const decision = await service.procesarJob(viejo, min(45));

      expect(decision).toBe('OMITIR_PLAZO_CAMBIADO');
      expect(vencimiento.resolverFila).not.toHaveBeenCalled();
      expect(sql.get('ENTREGA_CIERRE', 2).abierta).toBe(true);
      expect(sql.eventos).toEqual([]);
    });

    it('los reintentos no duplican cierre ni auditoría', async () => {
      const { sql, service, payloadDe } = build();
      sql.put('DOTACION', 1, min(30));
      const payload = payloadDe('DOTACION', 1, min(30));

      await service.procesarJob(payload, min(31));
      const segunda = await service.procesarJob(payload, min(32));

      expect(segunda).toBe('OMITIR_NO_PENDIENTE');
      expect(sql.eventos).toHaveLength(1);
    });

    it('dos ejecuciones concurrentes (job vs. job) producen un solo cierre y un solo evento', async () => {
      const { sql, service, payloadDe } = build();
      sql.put('ENTREGA_RECEPCION', 3, min(30));
      const payload = payloadDe('ENTREGA_RECEPCION', 3, min(30));

      const [a, b] = await Promise.all([
        service.procesarJob(payload, min(31)),
        service.procesarJob(payload, min(31)),
      ]);

      expect([a, b].sort()).toEqual(['EJECUTAR', 'OMITIR_NO_PENDIENTE']);
      expect(sql.eventos).toHaveLength(1);
    });

    it('si despertó antes del plazo lanza un error transitorio y no cierra', async () => {
      const { sql, vencimiento, service, payloadDe } = build();
      sql.put('DOTACION', 1, min(30));
      await expect(service.procesarJob(payloadDe('DOTACION', 1, min(30)), min(29))).rejects.toBeInstanceOf(
        VencimientoAunNoVenceError,
      );
      expect(vencimiento.resolverFila).not.toHaveBeenCalled();
    });

    it('un registro inexistente o ya cerrado es no-op, no error', async () => {
      const { service, payloadDe } = build();
      await expect(service.procesarJob(payloadDe('DOTACION', 99, min(30)), min(40))).resolves.toBe(
        'OMITIR_NO_PENDIENTE',
      );
    });

    it.each([
      [{ tipo: 'OTRO', entidadId: 1, fechaLimite: min(1).toISOString() }],
      [{ tipo: 'DOTACION', entidadId: 'x', fechaLimite: min(1).toISOString() }],
      [{ tipo: 'DOTACION', entidadId: 1, fechaLimite: 'no-es-fecha' }],
      [undefined],
    ])('un payload inválido es un error permanente (sin reintentos): %j', async payload => {
      const { service } = build();
      await expect(service.procesarJob(payload as never, min(40))).rejects.toBeInstanceOf(
        PermanentJobError,
      );
    });
  });

  describe('recuperación y reconciliación', () => {
    it('tras una caída, lo vencido se resuelve directo desde SQL sin depender de la cola', async () => {
      const { sql, scheduler, service } = build();
      sql.put('DOTACION', 1, min(-60));
      sql.put('ENTREGA_CIERRE', 2, min(120));
      scheduler.failing = true;

      await expect(service.recuperarTenant(T0)).rejects.toThrow('Backend de jobs caído');

      expect(sql.get('DOTACION', 1).abierta).toBe(false);
      expect(sql.eventos).toEqual(['VENCIMIENTO-DOTACION-1']);
    });

    it('cuando el backend de jobs vuelve, la reconciliación repara los jobs perdidos', async () => {
      const { sql, scheduler, service } = build();
      sql.put('ENTREGA_CIERRE', 2, min(120));
      scheduler.failing = true;
      await service.sincronizar(T0);
      expect(scheduler.jobs).toHaveLength(0);

      scheduler.failing = false;
      const result = await service.recuperarTenant(T0);

      expect(result.scheduled).toBe(1);
      expect(scheduler.jobs.map(j => j.key)).toEqual(['ENTREGA_CIERRE-2']);
    });

    it('recuperar es idempotente: una segunda pasada no cambia nada', async () => {
      const { sql, scheduler, service } = build();
      sql.put('ENTREGA_CIERRE', 2, min(120));
      await service.recuperarTenant(T0);
      const segunda = await service.recuperarTenant(T0);
      expect(segunda).toEqual({ scheduled: 0, cancelled: 0, unchanged: 1 });
      expect(scheduler.jobs).toHaveLength(1);
    });
  });
});
