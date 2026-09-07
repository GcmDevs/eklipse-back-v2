import {
  EstadoDespachoProductoCode,
  EstadoSolicitudPedidoCode,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
} from '@inn/types/inn/solicitud-pedido';
import { ExistenciaDinamica } from './existencias-dinamica.impl';

export const calcularEstadoSolicitudPedido = (
  estados: EstadoDespachoProductoCode[]
): EstadoSolicitudPedidoCode => {
  const rechazado = ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode();
  const sobrepedido = ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode();
  const facturado = ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode();
  const pendiente = ESTADOS_DESPACHO_PRODUCTO.PENDIENTE.getCode();

  if (estados.some(estado => estado === sobrepedido)) {
    return ESTADOS_SOLICITUD_PEDIDO.SOBREPEDIDO.getCode();
  }
  if (estados.every(estado => estado === rechazado)) {
    return ESTADOS_SOLICITUD_PEDIDO.RECHAZADO.getCode();
  }
  if (estados.every(estado => estado === rechazado || estado === facturado)) {
    return ESTADOS_SOLICITUD_PEDIDO.FACTURADO.getCode();
  }
  if (estados.every(estado => estado === pendiente)) {
    return ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode();
  }
  return ESTADOS_SOLICITUD_PEDIDO.PARCIAL.getCode();
};

export const validarExistenciasDespacho = (
  cantidadesPorCodigo: Map<string, number>,
  existencias: Map<string, ExistenciaDinamica>
): void => {
  cantidadesPorCodigo.forEach((cantidad, codigo) => {
    const existencia = existencias.get(codigo);
    if (!existencia?.productoEncontrado) {
      throw new Error(`El producto ${codigo} no existe en Dinamica`);
    }
    if (existencia.cantidad <= 0) {
      throw new Error(`El producto ${codigo} no tiene existencia disponible en Dinamica`);
    }
    if (cantidad > existencia.cantidad) {
      throw new Error(
        `La cantidad a despachar del producto ${codigo} (${cantidad}) supera la existencia disponible en Dinamica (${existencia.cantidad})`
      );
    }
  });
};
