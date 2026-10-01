import { NestFactory } from '@nestjs/core';
import { ResourcesModule } from './resources.module';

async function bootstrap() {
  const app = await NestFactory.create(ResourcesModule);
  await app.listen(3000);
}
bootstrap();
