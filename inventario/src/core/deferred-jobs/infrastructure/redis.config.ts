import { RedisOptions } from 'ioredis';

export interface DeferredJobsConfig {
  enabled: boolean;
  queueName: string;
  prefix: string;
  redis: RedisOptions;
}

export const loadDeferredJobsConfig = (env: NodeJS.ProcessEnv = process.env): DeferredJobsConfig => ({
  enabled: (env.DEFERRED_JOBS_ENABLED ?? 'true').toLowerCase() !== 'false',
  queueName: 'deferred-jobs',
  prefix: env.DEFERRED_JOBS_PREFIX ?? 'eklipse-gcm',
  redis: {
    host: env.REDIS_HOST ?? '127.0.0.1',
    port: Number(env.REDIS_PORT ?? 6379),
    password: env.REDIS_PASSWORD || undefined,
    db: Number(env.REDIS_DB ?? 0),
  },
});
