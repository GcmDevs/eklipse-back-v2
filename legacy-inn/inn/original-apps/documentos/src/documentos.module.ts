import { Module } from '@nestjs/common';
import { SuministrosPacientesModule } from './suministros-pacientes/suministros-pacientes.module';

@Module({
  imports: [SuministrosPacientesModule],
})
export class DocumentosModule {}
