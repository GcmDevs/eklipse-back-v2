import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfigService } from './config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: true });
  const config = app.get(AppConfigService);

  app.enableCors({
    origin: config.corsOrigins.length > 0 ? [...config.corsOrigins] : false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  app.enableShutdownHooks();
  await app.listen(config.port, config.host);
  Logger.log(`Aplicación iniciada en ${await app.getUrl()} (${config.environment})`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error(
    'La aplicación no pudo iniciar.',
    error instanceof Error ? error.stack : String(error),
    'Bootstrap'
  );
  process.exit(1);
});
