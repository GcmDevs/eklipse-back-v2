import { NestFactory } from '@nestjs/core';
import { InventarioModule2 } from './inventario.module';

async function bootstrap() {
  const app = await NestFactory.create(InventarioModule2);
  await app.listen(3000);
}
bootstrap();
