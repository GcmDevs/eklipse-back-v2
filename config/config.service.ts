import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from './environment.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get environment() {
    return this.config.get('NODE_ENV', { infer: true });
  }
  get isProduction() {
    return this.environment === 'production';
  }
  get host() {
    return this.config.get('HOST', { infer: true });
  }
  get port() {
    return this.config.get('PORT', { infer: true });
  }
  get jwtSecret() {
    return this.config.get('JWT_SECRET', { infer: true });
  }
  get corsOrigins() {
    return this.config.get('CORS_ORIGINS', { infer: true });
  }
  get logLevel() {
    return this.config.get('LOG_LEVEL', { infer: true });
  }
  get databaseUrl() {
    return this.config.get('DATABASE_URL', { infer: true });
  }
  get swaggerEnabled() {
    return this.config.get('SWAGGER_ENABLED', { infer: true });
  }
  get isTest() {
    return this.environment === 'test';
  }
}
