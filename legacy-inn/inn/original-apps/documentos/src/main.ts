import { NestFactory } from '@nestjs/core';
import { DocumentosModule } from './documentos.module';

async function bootstrap() {
  const app = await NestFactory.create(DocumentosModule);
  await app.listen(3000);
}
bootstrap();
