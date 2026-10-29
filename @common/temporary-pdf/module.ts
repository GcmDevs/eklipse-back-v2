import { Module } from '@nestjs/common';
import { TemporaryPdfController } from './controller';
import { TemporaryPdfService } from './service';

@Module({
  controllers: [TemporaryPdfController],
  providers: [TemporaryPdfService],
  exports: [TemporaryPdfService],
})
export class TemporaryPdfModule {}
