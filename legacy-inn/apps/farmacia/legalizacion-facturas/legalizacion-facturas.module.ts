import { Module } from '@nestjs/common';
import { LegalizacionFacturasController } from './presentation';
import {
  CargarFacturaLegalizacionFacturaImpl,
  CreateLegalizacionFacturasImpl,
  FetchLegalizacionFacturasImpl,
  RechazarLegalizacionFacturaImpl,
  CheckVistoLegalizacionFacturaImpl,
  ConciliarLegalizacionFacturaImpl,
} from './infrastructure/services';

@Module({
  imports: [],
  controllers: [LegalizacionFacturasController],
  providers: [
    CreateLegalizacionFacturasImpl,
    FetchLegalizacionFacturasImpl,
    CargarFacturaLegalizacionFacturaImpl,
    RechazarLegalizacionFacturaImpl,
    CheckVistoLegalizacionFacturaImpl,
    ConciliarLegalizacionFacturaImpl,
  ],
})
export class LegalizacionFacturasModule {}
