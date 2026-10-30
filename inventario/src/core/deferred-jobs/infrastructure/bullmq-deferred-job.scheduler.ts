import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Job, Queue, UnrecoverableError, Worker } from 'bullmq';
import {
  DeferredJobData,
  buildDeferredJobId,
  delayUntil,
  planReconcile,
  runDeferredJob,
  summarizeReconcile,
  toJobData,
} from '../application/helpers/deferred-job.helpers';
import { DeferredJobHandlerRegistry } from '../application/deferred-job-handler.registry';
import {
  DeferredJobScheduler,
  DeferredJobSpec,
  FailedJobInfo,
  PermanentJobError,
  ReconcileResult,
  ScheduledJobInfo,
  ScheduledJobState,
} from '../domain';
import { DeferredJobsConfig, loadDeferredJobsConfig } from './redis.config';

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = 5_000;
const COMPLETED_RETENTION = { age: 60 * 60, count: 200 };
const FAILED_RETENTION = { age: 7 * 24 * 60 * 60, count: 1_000 };
const PENDING_STATES = ['delayed', 'waiting', 'prioritized', 'active'] as const;
const ERROR_LOG_THROTTLE_MS = 30_000;
const OPERATION_TIMEOUT_MS = 3_000;
const BREAKER_OPEN_MS = 30_000;
const SHUTDOWN_TIMEOUT_MS = 3_000;
const CONNECTIVITY_ERROR = /ECONN|ETIMEDOUT|closed|writeable|connect|not ready/i;

class RedisTimeoutError extends Error {
  constructor(ms: number) {
    super(`Redis no respondió en ${ms} ms`);
    this.name = 'RedisTimeoutError';
  }
}

@Injectable()
export class BullMqDeferredJobScheduler
  implements DeferredJobScheduler, OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(BullMqDeferredJobScheduler.name);
  private readonly config: DeferredJobsConfig = loadDeferredJobsConfig();
  private queue?: Queue<DeferredJobData>;
  private worker?: Worker<DeferredJobData>;
  private lastErrorLogAt = 0;
  private unavailableUntil = 0;

  constructor(private readonly registry: DeferredJobHandlerRegistry) {}

  onApplicationBootstrap(): void {
    if (!this.config.enabled) {
      this.logger.warn('DEFERRED_JOBS_ENABLED=false: los jobs diferidos están desactivados');
      return;
    }
    const { queueName, prefix, redis } = this.config;

    this.queue = new Queue<DeferredJobData>(queueName, {
      prefix,
      connection: { ...redis, enableOfflineQueue: false },
      defaultJobOptions: {
        attempts: MAX_ATTEMPTS,
        backoff: { type: 'exponential', delay: BACKOFF_MS },
        removeOnComplete: COMPLETED_RETENTION,
        removeOnFail: FAILED_RETENTION,
      },
    });
    this.queue.on('error', err => this.logRedisError('queue', err));

    this.worker = new Worker<DeferredJobData>(queueName, job => this.process(job), {
      prefix,
      connection: { ...redis, maxRetriesPerRequest: null },
      concurrency: 1,
    });
    this.worker.on('error', err => this.logRedisError('worker', err));
    this.worker.on('ready', () => {
      this.logger.log('Backend de jobs diferidos listo');
      this.unavailableUntil = 0;
      this.registry.notifyBackendReady();
    });
    this.worker.on('failed', (job, err) =>
      this.logger.warn(
        `Job ${job?.id} falló (intento ${job?.attemptsMade}/${job?.opts.attempts}): ${err.message}`,
      ),
    );
  }

  async onApplicationShutdown(): Promise<void> {
    const bounded = (p?: Promise<unknown>) =>
      Promise.race([
        (p ?? Promise.resolve()).catch(() => undefined),
        new Promise(resolve => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS).unref()),
      ]);
    await bounded(this.worker?.close(true));
    await bounded(this.queue?.close());
    await bounded(this.queue?.disconnect());
  }

  // Toda operación pasa por `guarded`: con Redis caído BullMQ espera la conexión de forma
  // indefinida, y eso congelaría la petición de negocio ya confirmada en SQL.

  schedule(spec: DeferredJobSpec): Promise<void> {
    return this.guarded(async queue => {
      const jobs = await this.findPending(queue, spec.namespace, spec.scope);
      const sameKey = jobs.filter(j => j.data.key === spec.key);
      const alreadyThere = sameKey.some(j => j.data.runAtMs === spec.runAt.getTime());

      if (!alreadyThere) await this.addJob(queue, spec);
      await this.removeNotActive(sameKey.filter(j => j.data.runAtMs !== spec.runAt.getTime()));
    });
  }

  cancel(namespace: string, scope: string, key: string): Promise<number> {
    return this.guarded(async queue => {
      const jobs = await this.findPending(queue, namespace, scope);
      return this.removeNotActive(jobs.filter(j => j.data.key === key));
    });
  }

  listScheduled(namespace: string, scope?: string): Promise<ScheduledJobInfo[]> {
    return this.guarded(queue => this.listScheduledOn(queue, namespace, scope));
  }

  reconcile(namespace: string, scope: string, desired: DeferredJobSpec[]): Promise<ReconcileResult> {
    return this.guarded(async queue => {
      const current = await this.listScheduledOn(queue, namespace, scope);
      const plan = planReconcile(current, desired);

      for (const spec of plan.toSchedule) await this.addJob(queue, spec);

      let cancelled = 0;
      for (const info of plan.toCancel) {
        const job = await queue.getJob(buildDeferredJobId(namespace, scope, info.key, info.runAt));
        if (job && (await this.removeIfNotActive(job))) cancelled++;
      }
      return summarizeReconcile(plan, cancelled);
    });
  }

  listFailed(namespace: string, limit = 50): Promise<FailedJobInfo[]> {
    return this.guarded(async queue => {
      const failed = await queue.getFailed(0, Math.max(0, limit - 1));
      return failed
        .filter(j => j.data?.namespace === namespace)
        .map(j => ({
          id: j.id!,
          namespace: j.data.namespace,
          scope: j.data.scope,
          key: j.data.key,
          runAt: new Date(j.data.runAtMs),
          attempts: j.attemptsMade,
          reason: j.failedReason,
          failedAt: j.finishedOn ? new Date(j.finishedOn) : null,
        }));
    });
  }

  retryFailed(jobId: string): Promise<void> {
    return this.guarded(async queue => {
      const job = await queue.getJob(jobId);
      if (!job) throw new Error(`No existe el job ${jobId}`);
      await job.retry('failed');
    });
  }

  processDue(): Promise<number> {
    return Promise.resolve(0);
  }

  // ── internos ────────────────────────────────────────────────────────────

  /**
   * Acota cada operación en el tiempo y abre un breaker corto tras un fallo de conectividad:
   * mientras esté abierto, las operaciones fallan al instante (sin sumar latencia a cada
   * petición). El breaker se cierra solo al vencer o cuando el worker reporta Redis listo.
   */
  private async guarded<T>(op: (queue: Queue<DeferredJobData>) => Promise<T>): Promise<T> {
    const queue = this.requireQueue();
    if (Date.now() < this.unavailableUntil) {
      throw new Error('Redis no disponible (reintento diferido)');
    }
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        op(queue),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new RedisTimeoutError(OPERATION_TIMEOUT_MS)),
            OPERATION_TIMEOUT_MS,
          );
        }),
      ]);
    } catch (error) {
      if (error instanceof RedisTimeoutError || CONNECTIVITY_ERROR.test((error as Error).message)) {
        this.unavailableUntil = Date.now() + BREAKER_OPEN_MS;
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async listScheduledOn(
    queue: Queue<DeferredJobData>,
    namespace: string,
    scope?: string,
  ): Promise<ScheduledJobInfo[]> {
    const jobs = await this.findPending(queue, namespace, scope);
    const infos: ScheduledJobInfo[] = [];
    for (const job of jobs) infos.push(await this.toInfo(job));
    return infos;
  }

  private async process(job: Job<DeferredJobData>): Promise<void> {
    try {
      await runDeferredJob(
        this.registry,
        job.data,
        job.attemptsMade + 1,
        job.opts.attempts ?? 1,
      );
    } catch (error) {
      if (error instanceof PermanentJobError) throw new UnrecoverableError(error.message);
      throw error;
    }
  }

  private async addJob(queue: Queue<DeferredJobData>, spec: DeferredJobSpec): Promise<void> {
    const jobId = buildDeferredJobId(spec.namespace, spec.scope, spec.key, spec.runAt);
    // Un job terminado con el mismo id (retención) bloquearía el alta: se retira antes.
    const previous = await queue.getJob(jobId);
    if (previous) {
      const state = await previous.getState();
      if (state !== 'completed' && state !== 'failed') return;
      await previous.remove();
    }
    await queue.add(spec.namespace, toJobData(spec), {
      jobId,
      delay: delayUntil(spec.runAt),
    });
  }

  private async findPending(
    queue: Queue<DeferredJobData>,
    namespace: string,
    scope?: string,
  ): Promise<Job<DeferredJobData>[]> {
    const jobs = await queue.getJobs([...PENDING_STATES], 0, -1);
    return jobs.filter(
      j => j?.data?.namespace === namespace && (scope === undefined || j.data.scope === scope),
    );
  }

  private async toInfo(job: Job<DeferredJobData>): Promise<ScheduledJobInfo> {
    const state = await job.getState();
    return {
      namespace: job.data.namespace,
      scope: job.data.scope,
      key: job.data.key,
      runAt: new Date(job.data.runAtMs),
      state: (state === 'active' ? 'active' : state === 'delayed' ? 'delayed' : 'waiting') as ScheduledJobState,
    };
  }

  private async removeNotActive(jobs: Job<DeferredJobData>[]): Promise<number> {
    let removed = 0;
    for (const job of jobs) if (await this.removeIfNotActive(job)) removed++;
    return removed;
  }

  private async removeIfNotActive(job: Job<DeferredJobData>): Promise<boolean> {
    if ((await job.getState()) === 'active') return false;
    try {
      await job.remove();
      return true;
    } catch {
      // El worker lo tomó entre la consulta y el borrado: su re-validación lo vuelve no-op.
      return false;
    }
  }

  private requireQueue(): Queue<DeferredJobData> {
    if (!this.queue) throw new Error('Jobs diferidos no disponibles (backend desactivado o no iniciado)');
    return this.queue;
  }

  private logRedisError(source: string, err: Error): void {
    const now = Date.now();
    if (now - this.lastErrorLogAt < ERROR_LOG_THROTTLE_MS) return;
    this.lastErrorLogAt = now;
    this.logger.error(`Redis (${source}) no disponible: ${err.message}`);
  }
}
