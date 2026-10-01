import { Module } from '@nestjs/common';
import { ReportesModule } from './reportes/reportes.module';

const modules = [ReportesModule];
@Module({
  imports: modules,
  exports: modules,
})
export class HistoriaClinicaModule {}
