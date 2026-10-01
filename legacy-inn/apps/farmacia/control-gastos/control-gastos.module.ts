import { Module } from '@nestjs/common';
import { ControlGastosController } from './presentation/controllers';
import {
  CargarFacturaControlGastoImpl,
  ConciliarControlGastoImpl,
  CreateControlGastoImpl,
  DocumentoVistoControlGastoImpl,
  FetchControlGastoImpl,
  FindByIdControlGastoImpl,
  HistorialGastoImpl,
  RechazarDocumentoControlGastoImpl,
  SolicitudMaosImpl,
  UpdateControlGastoImpl,
} from './infrastructure/services';

@Module({
  controllers: [ControlGastosController],
  providers: [
    CreateControlGastoImpl,
    ConciliarControlGastoImpl,
    FetchControlGastoImpl,
    CargarFacturaControlGastoImpl,
    RechazarDocumentoControlGastoImpl,
    HistorialGastoImpl,
    DocumentoVistoControlGastoImpl,
    SolicitudMaosImpl,
    FindByIdControlGastoImpl,
    UpdateControlGastoImpl,
  ],
})
export class ControlGastosModule {}
