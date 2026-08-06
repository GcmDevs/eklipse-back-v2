import { Module } from '@nestjs/common';
import { AddOCImpl, CotizacionServicesSource } from './infrastructure/services/cotizaciones';
import { CotizacionServicesController } from './presentation/controllers/cotizaciones-services.controller';

@Module({
  controllers: [CotizacionServicesController],
  providers: [CotizacionServicesSource, AddOCImpl],
})
export class CentralComprasModule {}
