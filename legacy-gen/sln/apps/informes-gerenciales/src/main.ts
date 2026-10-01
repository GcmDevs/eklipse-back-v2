import { NestFactory } from '@nestjs/core';
import { InformesGerencialesModule } from './informes-gerenciales.module';

async function bootstrap() {
  const app = await NestFactory.create(InformesGerencialesModule);
  await app.listen(3000);
}
bootstrap();
