import { Module } from '@nestjs/common';
import { SolicitudPedidoController } from './presentation/controllers/solicitud-pedido.controller';
import {
  ActualizarDespachoSolicitudPedidoImpl,
  BuscarProductoImpl,
  CreateSolicitudPedidoImpl,
  FetchSolicitudPedidosImpl,
} from './infraestructure/services';

@Module({
  controllers: [SolicitudPedidoController],
  providers: [
    FetchSolicitudPedidosImpl,
    CreateSolicitudPedidoImpl,
    BuscarProductoImpl,
    ActualizarDespachoSolicitudPedidoImpl,
  ],
})
export class SolicitudPedidoModule {}
