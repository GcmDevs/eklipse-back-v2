import { Module } from '@nestjs/common';
import { PdfImpl } from './services/pdf';
import { PdfController } from './controllers';

@Module({
  controllers: [PdfController],
  providers: [PdfImpl],
})
export class EnlExtModule {}
