import { Module } from '@nestjs/common';
import { FacturacionProxyRepository } from '../infrastructure';
import { FacturacionPeriodoController } from './facturacion-periodo.controller';
import { FacturacionTercerosController } from './facturacion-terceros.controller';
import {
  GetFacturacionEntidadesHandler,
  GetFacturacionPeriodoHandler,
  GetFacturacionTercerosHandler,
  GetResumenPeriodoHandler,
} from './handlers';

@Module({
  controllers: [FacturacionPeriodoController, FacturacionTercerosController],
  providers: [
    FacturacionProxyRepository,
    GetResumenPeriodoHandler,
    GetFacturacionPeriodoHandler,
    GetFacturacionEntidadesHandler,
    GetFacturacionTercerosHandler,
  ],
})
export class FacturacionV2Module {}
