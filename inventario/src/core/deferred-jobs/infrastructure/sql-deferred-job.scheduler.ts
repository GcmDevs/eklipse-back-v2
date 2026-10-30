import { GCM_CONTEXTS } from '@common/domain/types';
import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { getUser, switchConn } from '@common/infrastructure/services';
import { waitContextsReady } from '../application/helpers/wait-data-sources.helper';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { In, LessThan, LessThanOrEqual } from 'typeorm';
import { DeferredJobHandlerRegistry } from '../application/deferred-job-handler.registry';
import {
  DeferredJobData,
  buildDeferredJobId,
  planReconcile,
  runDeferredJob,
  summarizeReconcile,
  toJobData,
} from '../application/helpers/deferred-job.helpers';
import {
  SQL_JOB_CLAIM_BATCH,
  SQL_JOB_MAX_ATTEMPTS,
  completedRetentionCutoff,
  decideJobOutcome,
  failedRetentionCutoff,
  nextRetryAt,
} from '../application/helpers/sql-deferred-job.helpers';
import {
  DeferredJobScheduler,
  DeferredJobSpec,
  FailedJobInfo,
  PermanentJobError,
  ReconcileResult,
  ScheduledJobInfo,
} from '../domain';
import { DeferredJobOrm } from './persistence/orm/deferred-job.orm';

@Injectable()
export class SqlDeferredJobScheduler implements DeferredJobScheduler, OnApplicationBootstrap {
  private readonly logger = new Logger(SqlDeferredJobScheduler.name);

  constructor(private readonly registry: DeferredJobHandlerRegistry) {}

  onApplicationBootstrap(): void {
    this.logger.log('Backend de jobs diferidos: SQL Server (Redis/BullMQ desconectado)');
    void waitContextsReady([GCM_CONTEXTS.EKLIPSE])
      .then(() => this.registry.notifyBackendReady())
      .catch(error => this.logger.error((error as Error).message));
  }

  async schedule(spec: DeferredJobSpec): Promise<void> {
    const repo = this.repo();
    const jobId = buildDeferredJobId(spec.namespace, spec.scope, spec.key, spec.runAt);
    const existing = await repo.findOne({ where: { jobId } });
    if (existing && (existing.status === 'PENDING' || existing.status === 'ACTIVE')) return;

    if (existing) await repo.delete({ id: existing.id });
    await this.removePendingOfKey(spec.namespace, spec.scope, spec.key);
    await repo.save(this.toNewRow(spec, jobId));
  }

  async cancel(namespace: string, scope: string, key: string): Promise<number> {
    return this.removePendingOfKey(namespace, scope, key);
  }

  async listScheduled(namespace: string, scope?: string): Promise<ScheduledJobInfo[]> {
    const where: Record<string, unknown> = {
      namespace,
      status: In(['PENDING', 'ACTIVE']),
    };
    if (scope !== undefined) where.scope = scope;
    const rows = await this.repo().find({ where });
    return rows.map(row => this.toInfo(row));
  }

  async reconcile(
    namespace: string,
    scope: string,
    desired: DeferredJobSpec[],
  ): Promise<ReconcileResult> {
    const current = await this.listScheduled(namespace, scope);
    const plan = planReconcile(current, desired);
    for (const spec of plan.toSchedule) await this.schedule(spec);
    let cancelled = 0;
    for (const info of plan.toCancel) {
      cancelled += await this.removePendingOfKey(namespace, scope, info.key);
    }
    return summarizeReconcile(plan, cancelled);
  }

  async listFailed(namespace: string, limit = 50): Promise<FailedJobInfo[]> {
    const rows = await this.repo().find({
      where: { namespace, scope: this.scope(), status: 'FAILED' },
      order: { updatedAt: 'DESC' },
      take: Math.max(1, limit),
    });
    return rows.map(row => ({
      id: row.jobId,
      namespace: row.namespace,
      scope: row.scope,
      key: row.key,
      runAt: row.runAt,
      attempts: row.attempts,
      reason: row.lastError ?? '',
      failedAt: row.updatedAt,
    }));
  }

  async retryFailed(jobId: string): Promise<void> {
    const repo = this.repo();
    const row = await repo.findOne({ where: { jobId, status: 'FAILED' } });
    if (!row) throw new Error(`No existe el job fallido ${jobId}`);
    const now = new Date();
    row.status = 'PENDING';
    row.attempts = 0;
    row.nextTryAt = now;
    row.lastError = undefined;
    row.updatedAt = now;
    await repo.save(row);
  }

  async processDue(now = new Date()): Promise<number> {
    const repo = this.repo();
    const scope = this.scope();
    await repo.delete({ status: 'COMPLETED', updatedAt: LessThan(completedRetentionCutoff(now)) });
    await repo.delete({ status: 'FAILED', updatedAt: LessThan(failedRetentionCutoff(now)) });

    const due = await repo.find({
      where: { status: 'PENDING', scope, nextTryAt: LessThanOrEqual(now) },
      order: { nextTryAt: 'ASC' },
      take: SQL_JOB_CLAIM_BATCH,
    });

    let processed = 0;
    for (const row of due) {
      const claimed = await repo
        .createQueryBuilder()
        .update(DeferredJobOrm)
        .set({ status: 'ACTIVE', attempts: row.attempts + 1, updatedAt: now })
        .where('OID = :id AND ESTADO = :status', { id: row.id, status: 'PENDING' })
        .execute();
      if (!claimed.affected) continue;

      row.attempts += 1;
      await this.executeClaimed(row, now);
      processed++;
    }
    return processed;
  }

  private async executeClaimed(row: DeferredJobOrm, now: Date): Promise<void> {
    const data: DeferredJobData = {
      namespace: row.namespace,
      scope: row.scope,
      key: row.key,
      runAtMs: row.runAt.getTime(),
      payload: row.payload,
    };
    try {
      await runDeferredJob(this.registry, data, row.attempts, row.maxAttempts);
      await this.finish(row, 'COMPLETED', now);
    } catch (error) {
      const err = error as Error;
      const permanent = error instanceof PermanentJobError;
      const outcome = decideJobOutcome(err, row.attempts, row.maxAttempts, permanent);
      if (outcome === 'RETRY') {
        const retryAt = nextRetryAt(row.attempts, now);
        await this.repo().update(
          { id: row.id },
          {
            status: 'PENDING',
            nextTryAt: retryAt,
            lastError: err.message.slice(0, 500),
            updatedAt: now,
          },
        );
        this.logger.warn(
          `Job ${row.jobId} reintento ${row.attempts}/${row.maxAttempts} a las ${retryAt.toISOString()}: ${err.message}`,
        );
        return;
      }
      await this.finish(row, 'FAILED', now, err.message);
      this.logger.warn(`Job ${row.jobId} falló de forma permanente: ${err.message}`);
    }
  }

  private async finish(
    row: DeferredJobOrm,
    status: 'COMPLETED' | 'FAILED',
    now: Date,
    lastError?: string,
  ): Promise<void> {
    await this.repo().update(
      { id: row.id },
      { status, lastError: lastError?.slice(0, 500), updatedAt: now },
    );
  }

  private async removePendingOfKey(namespace: string, scope: string, key: string): Promise<number> {
    const result = await this.repo().delete({ namespace, scope, key, status: 'PENDING' });
    return result.affected ?? 0;
  }

  private toNewRow(spec: DeferredJobSpec, jobId: string): DeferredJobOrm {
    const now = new Date();
    const row = new DeferredJobOrm();
    row.jobId = jobId;
    row.namespace = spec.namespace;
    row.scope = spec.scope;
    row.key = spec.key;
    row.runAt = spec.runAt;
    row.payload = toJobData(spec).payload;
    row.status = 'PENDING';
    row.attempts = 0;
    row.maxAttempts = SQL_JOB_MAX_ATTEMPTS;
    row.nextTryAt = spec.runAt.getTime() <= now.getTime() ? now : spec.runAt;
    row.createdAt = now;
    row.updatedAt = now;
    return row;
  }

  private toInfo(row: DeferredJobOrm): ScheduledJobInfo {
    return {
      namespace: row.namespace,
      scope: row.scope,
      key: row.key,
      runAt: row.runAt,
      state: row.status === 'ACTIVE' ? 'active' : 'delayed',
    };
  }

  private scope(): string {
    return getUser().context.getCode();
  }

  private repo() {
    return resolveRepository(switchConn(GCM_CONTEXTS.EKLIPSE), DeferredJobOrm);
  }
}
