import { Module } from '@nestjs/common';
import { GeneradorReportesController } from './presentation/controllers/reportes.controller';
import { GeneradorReportesImpl } from './infrastructure/services/reportes.impl';
import { EjecucionesReportesImpl } from './infrastructure/services/ejecuciones.impl';

@Module({
  controllers: [GeneradorReportesController],
  // El ejecutor se comparte entre solicitudes para impedir generaciones simultáneas.
  providers: [GeneradorReportesImpl, EjecucionesReportesImpl],
})
export class GeneradorReportesModule {}
