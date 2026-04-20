import { Module } from '@nestjs/common';
import { SumPacModule } from './suministros-paciente/module';

const modules = [SumPacModule];

@Module({
  imports: modules,
  exports: modules,
})
export class DocumentosModule {}
