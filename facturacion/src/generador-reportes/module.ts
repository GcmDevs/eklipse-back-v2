import { Module } from '@nestjs/common';
import { GeneradorReportesController } from './presentation/controllers/reportes.controller';
import { GeneradorReportesImpl } from './infrastructure/services/reportes.impl';

@Module({ controllers: [GeneradorReportesController], providers: [GeneradorReportesImpl] })
export class GeneradorReportesModule {}
