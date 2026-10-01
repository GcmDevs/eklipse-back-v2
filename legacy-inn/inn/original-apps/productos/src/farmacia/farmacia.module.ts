import { Module } from '@nestjs/common';
import {
  ReporteActualController,
  ReporteDisponibleTodosController,
  ReporteOncologiaController,
  ReportesController,
} from './presentation/controllers';

@Module({
  controllers: [
    ReportesController,
    ReporteActualController,
    ReporteOncologiaController,
    ReporteDisponibleTodosController,
  ],
})
export class FarmaciaModule {}
