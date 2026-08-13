import { Module } from '@nestjs/common';
import { SolicitudPedidoController } from './presentation/controllers/solicitud-pedido.controller';
import {
  ActualizarDespachoSolicitudPedidoImpl,
  BuscarProductoImpl,
  CheckVistoSolicitudPedidoImpl,
  ConciliarSolicitudPedidoImpl,
  CreateSolicitudPedidoImpl,
  FetchSolicitudPedidosImpl,
  RechazarSolicitudPedidoImpl,
} from './infraestructure/services';

@Module({
  controllers: [SolicitudPedidoController],
  providers: [
    CheckVistoSolicitudPedidoImpl,
    FetchSolicitudPedidosImpl,
    RechazarSolicitudPedidoImpl,
    ConciliarSolicitudPedidoImpl,
    CreateSolicitudPedidoImpl,
    BuscarProductoImpl,
    ActualizarDespachoSolicitudPedidoImpl,
  ],
})
export class SolicitudPedidoModule {}
