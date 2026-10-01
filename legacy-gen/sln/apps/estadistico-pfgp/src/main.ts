import { NestFactory } from '@nestjs/core';
import { EstadisticoPFGPModule } from './estadistico-pfgp.module';

async function bootstrap() {
  const app = await NestFactory.create(EstadisticoPFGPModule);
  await app.listen(3000);
}
bootstrap();
