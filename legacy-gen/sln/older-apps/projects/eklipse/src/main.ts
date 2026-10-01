import { NestFactory } from '@nestjs/core';
import { EklipseModule } from './eklipse.module';

async function bootstrap() {
  const app = await NestFactory.create(EklipseModule);
  await app.listen(3000);
}
bootstrap();
