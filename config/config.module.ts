import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import { NODE_ENVIRONMENTS, NodeEnvironment, validateEnv } from './environment.schema';

function resolveNodeEnv(value = 'development'): NodeEnvironment {
  if (!(NODE_ENVIRONMENTS as readonly string[]).includes(value)) {
    throw new Error(`NODE_ENV inválido: ${value}. Permitidos: ${NODE_ENVIRONMENTS.join(', ')}`);
  }
  return value as NodeEnvironment;
}
const nodeEnv = resolveNodeEnv(process.env.NODE_ENV);

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: false,
      ignoreEnvFile: nodeEnv === 'production',
      envFilePath: [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env.local', '.env'],
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
