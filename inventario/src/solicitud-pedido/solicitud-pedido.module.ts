import { Module } from '@nestjs/common';
import { SolicitudPedidoController } from './presentation/controllers/solicitud-pedido.controller';
import {
  ActualizarDespachoSolicitudPedidoImpl,
  BuscarProductoImpl,
  CreateSolicitudPedidoImpl,
  ExistenciasDinamicaImpl,
  FetchDetalleSolicitudPedidoImpl,
  FetchSolicitudPedidosImpl,
  ImpactoSobrepedidoImpl,
  ReporteSolicitudPedidoImpl,
  RechazarSolicitudPedidoImpl,
} from './infraestructure/services';

@Module({
  controllers: [SolicitudPedidoController],
  providers: [
    FetchSolicitudPedidosImpl,
    CreateSolicitudPedidoImpl,
    BuscarProductoImpl,
    ActualizarDespachoSolicitudPedidoImpl,
    ExistenciasDinamicaImpl,
    FetchDetalleSolicitudPedidoImpl,
    RechazarSolicitudPedidoImpl,
    ImpactoSobrepedidoImpl,
    ReporteSolicitudPedidoImpl,
  ],
})
export class SolicitudPedidoModule {}
