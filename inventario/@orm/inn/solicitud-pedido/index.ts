import { SolicitudPedidoHistorialOrm } from './solicitud-pedido-historial.orm';
import { SolicitudPedidoProductoOrm } from './solicitud-pedido-producto.orm';
import { SolicitudPedidoProductoDespachoOrm } from './solicitud-pedido-producto-despacho.orm';
import { SolicitudPedidoOrm } from './solicitud-pedido.orm';

export * from './solicitud-pedido.orm';
export * from './solicitud-pedido-historial.orm';
export * from './solicitud-pedido-producto.orm';
export * from './solicitud-pedido-producto-despacho.orm';

export const ORM_INN_SOLICITUD_PEDIDO_ENTITIES = [
  // --- AVOID NOWRAP --- //
  SolicitudPedidoOrm,
  SolicitudPedidoHistorialOrm,
  SolicitudPedidoProductoOrm,
  SolicitudPedidoProductoDespachoOrm,
];
