import { NestFactory } from '@nestjs/core';
import { ServiciosModule } from './farmacia/servicios.module';

async function bootstrap() {
  const app = await NestFactory.create(ServiciosModule);
  await app.listen(3000);
}
bootstrap();
