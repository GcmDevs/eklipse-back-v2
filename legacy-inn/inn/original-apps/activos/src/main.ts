import { NestFactory } from '@nestjs/core';
import { ActivosModule } from './activos.module';

async function bootstrap() {
  const app = await NestFactory.create(ActivosModule);
  await app.listen(3000);
}
bootstrap();
