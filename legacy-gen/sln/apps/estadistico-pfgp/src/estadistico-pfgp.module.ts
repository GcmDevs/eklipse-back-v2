import { Module } from '@nestjs/common';
import {
  AcostadoController,
  CentralizadoController,
  FacturadoController,
  RegistroController,
} from './presentation/controllers';
import { FetchFacturadoImpl } from './infrastructure/services/facturado';
import { FetchAcostadoImpl } from './infrastructure/services/acostado';
import { FetchConsolidadoImpl } from './infrastructure/services/consolidado';

@Module({
  providers: [FetchFacturadoImpl, FetchAcostadoImpl, FetchConsolidadoImpl],
  controllers: [
    FacturadoController,
    AcostadoController,
    CentralizadoController,
    RegistroController,
  ],
})
export class EstadisticoPFGPModule {}
