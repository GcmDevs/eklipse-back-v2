import { NestFactory } from '@nestjs/core';
import { ProductosModule } from './productos.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductosModule);
  await app.listen(3000);
}
bootstrap();
