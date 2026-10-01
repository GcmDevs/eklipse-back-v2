import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import { ENVIRONMENTS } from './app.environments';
import { AppModule } from './app.module';
import { initSwagger } from './app.swagger';

async function bootstrap() {
  const httpsOptions = {
    cert: fs.readFileSync('../rsa/https/certificate.pem', 'utf8'),
    key: fs.readFileSync('../rsa/https/certificate.key', 'utf8'),
  };

  const port = ENVIRONMENTS.port;
  const baseUrl = `http://localhost:${port}`;

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    ENVIRONMENTS.isHttps ? { httpsOptions } : {}
  );

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true,
    })
  );

  app.useStaticAssets('../public', {
    prefix: '/public',
    index: false,
  });

  if (ENVIRONMENTS.showDocs) initSwagger(app);

  app.enableCors({
    origin: "*",
    //  origin: function (origin, callback) {
    //       if (!origin || VALID_HOSTS.indexOf(origin) !== -1) {
    //         callback(null, true);
    //       } else {
    //         callback(new Error('Not allowed by CORS'));
    //       }
    // //
    //     optionsSuccessStatus: 204,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(ENVIRONMENTS.port);

  Logger.log(`Iniciado en puerto ${ENVIRONMENTS.port}`);
  Logger.log(`API documentation is running and available at: ${baseUrl}/docs`);
}

bootstrap();


