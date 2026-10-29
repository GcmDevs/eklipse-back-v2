import { Module } from '@nestjs/common';
import { GeneradorReportesController } from './presentation/controllers/reportes.controller';
import { GeneradorReportesImpl } from './infrastructure/services/reportes.impl';
import { EjecucionesReportesImpl } from './infrastructure/services/ejecuciones.impl';
import { ConsultaColaReportesImpl } from './infrastructure/services/consulta-cola.impl';

@Module({
  controllers: [GeneradorReportesController],
  // La cola y el ejecutor se comparten entre solicitudes; solo una generación se ejecuta a la vez.
  providers: [GeneradorReportesImpl, ConsultaColaReportesImpl, EjecucionesReportesImpl],
})
export class GeneradorReportesModule {}
