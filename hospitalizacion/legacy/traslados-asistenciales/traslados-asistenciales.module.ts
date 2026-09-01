import { Module } from '@nestjs/common';
import {
  TrasladoMonitoreoController,
  TrasladoController,
  TrasladoEvolucionController,
  TrasladoMovilController,
  TrasladoRecursosController,
  TrasladoRevisionCentralController,
} from './presentation/controllers';
import {
  TrasladoCrudSource,
  TrasladoEvolucionImpl,
  TrasladoRecursosImpl,
  TrasladoRevisionCentralImpl,
  SeguimientoTrasladoImpl,
} from './infrastructure/repositories';
import { RecursosCompartidosSource, DescargarPdfService } from './infrastructure/services';
import { SeguimientoTrasladoController } from './presentation/controllers/seguimiento.controller';
import { TrasladosRealtimeGateway } from './presentation/gateways/traslados-realtime.gateway';

@Module({
  controllers: [
    TrasladoRecursosController,
    TrasladoController,
    TrasladoMovilController,
    TrasladoEvolucionController,
    TrasladoMonitoreoController,
    TrasladoRevisionCentralController,
    SeguimientoTrasladoController,
  ],
  providers: [
    TrasladoRecursosImpl,
    TrasladoCrudSource,
    TrasladoEvolucionImpl,
    TrasladoRevisionCentralImpl,
    SeguimientoTrasladoImpl,
    RecursosCompartidosSource,
    DescargarPdfService,
    TrasladosRealtimeGateway,
  ],
})
export class LgcTasModule {}
