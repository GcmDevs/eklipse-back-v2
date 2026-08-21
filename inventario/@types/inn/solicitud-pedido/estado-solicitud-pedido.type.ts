import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type EstadoSolicitudPedidoCode = 1 | 2 | 3 | 4 | 5;

export class EstadoSolicitudPedidoType extends CtmType<EstadoSolicitudPedidoCode> {}

const PENDIENTE = new EstadoSolicitudPedidoType(1, 'PENDIENTE');
const PARCIAL = new EstadoSolicitudPedidoType(2, 'PARCIAL');
const FACTURADO = new EstadoSolicitudPedidoType(3, 'FACTURADO');
const SOBREPEDIDO = new EstadoSolicitudPedidoType(4, 'SOBREPEDIDO');
const RECHAZADO = new EstadoSolicitudPedidoType(5, 'RECHAZADO');

export function estadoSolicitudPedidoTypeFactory(
  code: EstadoSolicitudPedidoCode,
  throwErr = true
): EstadoSolicitudPedidoType {
  switch (code) {
    case 1:
      return PENDIENTE;
    case 2:
      return PARCIAL;
    case 3:
      return FACTURADO;
    case 4:
      return SOBREPEDIDO;
    case 5:
      return RECHAZADO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe estado con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ESTADOS_SOLICITUD_PEDIDO = {
  PENDIENTE,
  PARCIAL,
  FACTURADO,
  SOBREPEDIDO,
  RECHAZADO,
};

export const ESTADOS_SOLICITUD_PEDIDO_VALUES = [
  PENDIENTE,
  PARCIAL,
  FACTURADO,
  SOBREPEDIDO,
  RECHAZADO,
];

export const ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES: EstadoSolicitudPedidoCode[] = [
  FACTURADO.getCode(),
  SOBREPEDIDO.getCode(),
  RECHAZADO.getCode(),
];

export const esSolicitudPedidoCerrada = (estadoCode: EstadoSolicitudPedidoCode): boolean =>
  ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES.includes(estadoCode);

export const ESTADOS_AL_CONCILIAR_CODES = [PARCIAL.getCode(), FACTURADO.getCode()];
