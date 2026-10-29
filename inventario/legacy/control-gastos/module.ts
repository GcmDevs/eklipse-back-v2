import { Module } from '@nestjs/common';
import { ControlGastosController } from './presentation/controllers';
import { OrdenesControlGastoImpl } from './infrastructure/services/ordenes-control-gasto.impl';
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
    OrdenesControlGastoImpl,
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
export class LgcCgtModule {}
