import { Module } from '@nestjs/common';
import { SumPacModule } from './suministros-paciente/module';
import { GeneradorDocumentosFilesModule } from './generador/module';

const modules = [SumPacModule, GeneradorDocumentosFilesModule];

@Module({
  imports: modules,
  exports: modules,
})
export class DocumentosModule {}
