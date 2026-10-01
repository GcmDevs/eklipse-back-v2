import { Module } from '@nestjs/common';
import { UciSheetsService } from './uci-sheets.service';
import { UciSheetsController } from './uci-sheets.controller';
import { UciSheetsExternoRepository, UciSheetsRepository } from './repository';
import {
  FetchReporteSabanasUciExternoServices,
  FetchReporteSabanasUciServices,
} from '@hcn/rft/historia-clinica/reportes/infrastructure/services';
import { EstanciasService } from './estancias.service';
import { UciSheetsExternoController } from './uci-sheets-report.controller';
import { UciSheetsExternoService } from './uci-sheets-externo.service';

@Module({
  providers: [
    UciSheetsService,
    UciSheetsRepository,
    UciSheetsExternoService,
    UciSheetsExternoRepository,
    FetchReporteSabanasUciServices,
    FetchReporteSabanasUciExternoServices,
    EstanciasService,
  ],
  controllers: [UciSheetsController, UciSheetsExternoController],
  exports: [UciSheetsService],
})
export class UciSheetsModule {}
