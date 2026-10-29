import { Module } from '@nestjs/common';
import { FileGeneratorController } from './controller';
import { OrdenTrasladoImpl } from './orden-traslado';
import { TemporaryPdfModule } from '@common/temporary-pdf';

@Module({
  imports: [TemporaryPdfModule],
  controllers: [FileGeneratorController],
  providers: [OrdenTrasladoImpl],
})
export class GeneradorDocumentosFilesModule {}
