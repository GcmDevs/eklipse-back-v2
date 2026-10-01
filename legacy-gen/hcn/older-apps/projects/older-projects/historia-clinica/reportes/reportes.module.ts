import { Module } from '@nestjs/common';
import { SabanasUciController } from './presentation/controllers/sabanas-uci.controller';
import { PacientesCirugiaController } from './presentation/controllers';
import { FetchReporteSabanasUciServices } from './infrastructure/services';
@Module({
  controllers: [PacientesCirugiaController, SabanasUciController],
  providers: [FetchReporteSabanasUciServices],
})
export class ReportesModule {}
