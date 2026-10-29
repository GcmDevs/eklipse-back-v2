import { Module } from '@nestjs/common';
import { FileGeneratorController } from './controller';
import { OrdenTrasladoImpl } from './orden-traslado';

@Module({
  controllers: [FileGeneratorController],
  providers: [OrdenTrasladoImpl],
})
export class GeneradorDocumentosFilesModule {}
