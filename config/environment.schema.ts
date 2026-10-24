import { z } from 'zod';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

const corsOrigins = (defaultValue = '') =>
  z
    .string()
    .default(defaultValue)
    .transform((raw, ctx) => {
      const origins = new Set<string>();
      for (const candidate of raw.split(',').map(o => o.trim()).filter(Boolean)) {
        let url: URL;
        try {
          url = new URL(candidate);
        } catch {
          ctx.addIssue({ code: 'custom', message: `Origen inválido: "${candidate}"` });
          return z.NEVER;
        }
        const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
        const isPureOrigin =
          !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
        if (!isHttp || !isPureOrigin) {
          ctx.addIssue({
            code: 'custom',
            message: `"${candidate}" debe ser solo un origen http(s), ej. https://app.example.com`,
          });
          return z.NEVER;
        }
        origins.add(url.origin);
      }
      return [...origins] as readonly string[];
    });

const port = z.coerce.number().int().min(1).max(65535).default(3000);
const host = (def: string) => z.string().trim().min(1).default(def);
const flag = (def: 'true' | 'false') =>
  z.enum(['true', 'false']).default(def).transform(v => v === 'true');
const databaseUrl = z.string().url('DATABASE_URL debe ser una URL válida');
const secret = (min: number) =>
  z
    .string()
    .min(min, `JWT_SECRET debe tener al menos ${min} caracteres`)
    .regex(/^\S+$/, 'JWT_SECRET no debe contener espacios');

const developmentEnv = z.object({
  NODE_ENV: z.literal('development'),
  HOST: host('127.0.0.1'),
  PORT: port,
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
  JWT_SECRET: secret(32),
  DATABASE_URL: databaseUrl,
  CORS_ORIGINS: corsOrigins('http://localhost:5173,http://localhost:3001'),
  SWAGGER_ENABLED: flag('true'),
});

const testEnv = z.object({
  NODE_ENV: z.literal('test'),
  HOST: host('127.0.0.1'),
  PORT: port,
  LOG_LEVEL: z.enum(['info', 'warn', 'error', 'silent']).default('error'),
  JWT_SECRET: secret(32),
  DATABASE_URL: databaseUrl,
  CORS_ORIGINS: corsOrigins(),
  SWAGGER_ENABLED: flag('false'),
});

const productionEnv = z.object({
  NODE_ENV: z.literal('production'),
  HOST: host('0.0.0.0'),
  PORT: port,
  LOG_LEVEL: z.enum(['info', 'warn', 'error']).default('info'),
  JWT_SECRET: secret(64),
  DATABASE_URL: databaseUrl,
  CORS_ORIGINS: corsOrigins(),
  SWAGGER_ENABLED: flag('false'),
});

export const envSchema = z
  .discriminatedUnion('NODE_ENV', [developmentEnv, testEnv, productionEnv])
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });

    if (env.CORS_ORIGINS.length === 0) {
      fail('CORS_ORIGINS', 'Obligatorio en producción (al menos un origen explícito)');
    }
    for (const origin of env.CORS_ORIGINS) {
      const { protocol, hostname } = new URL(origin);
      if (protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(hostname)) {
        fail('CORS_ORIGINS', `En producción solo se permite https y no localhost (${origin})`);
      }
    }
    if (/dev|test|change.?me|secret/i.test(env.JWT_SECRET)) {
      fail('JWT_SECRET', 'Parece un secreto de desarrollo; genera uno aleatorio');
    }
  });

export type Env = z.infer<typeof envSchema>;
export type NodeEnvironment = Env['NODE_ENV'];

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse({ ...raw, NODE_ENV: raw.NODE_ENV ?? 'development' });

  if (!result.success) {
    const details = result.error.issues
      .map(issue => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${details}`);
  }

  return Object.freeze(result.data);
}