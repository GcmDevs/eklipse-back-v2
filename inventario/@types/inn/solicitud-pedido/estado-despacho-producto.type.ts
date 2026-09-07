import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type EstadoDespachoProductoCode = 1 | 2 | 3 | 4 | 5;

export class EstadoDespachoProductoType extends CtmType<EstadoDespachoProductoCode> {}

const PENDIENTE = new EstadoDespachoProductoType(1, 'PENDIENTE');
const PARCIAL = new EstadoDespachoProductoType(2, 'PARCIAL');
const FACTURADO = new EstadoDespachoProductoType(3, 'FACTURADO');
const SOBREPEDIDO = new EstadoDespachoProductoType(4, 'SOBREPEDIDO');
const RECHAZADO = new EstadoDespachoProductoType(5, 'RECHAZADO');

export function estadoDespachoProductoTypeFactory(
  code: EstadoDespachoProductoCode,
  throwErr = true
): EstadoDespachoProductoType {
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
      if ([null, undefined].includes(code)) return null;
      if (throwErr) throw new Error('No existe estado de despacho con este codigo');
      return DEFAULT_TYPE;
    }
  }
}

export const ESTADOS_DESPACHO_PRODUCTO = {
  PENDIENTE,
  PARCIAL,
  FACTURADO,
  SOBREPEDIDO,
  RECHAZADO,
};

export const calcularEstadoDespachoProducto = (
  cantidadSolicitada: number,
  cantidadEnviada: number
): { estadoCode: EstadoDespachoProductoCode; porcentaje: number } => {
  if (!Number.isFinite(cantidadSolicitada) || cantidadSolicitada <= 0) {
    throw new Error('La cantidad solicitada debe ser mayor a cero');
  }

  const porcentaje = Number(((cantidadEnviada / cantidadSolicitada) * 100).toFixed(2));

  if (porcentaje >= 91) {
    return { estadoCode: FACTURADO.getCode(), porcentaje };
  }
  if (porcentaje >= 75) {
    return { estadoCode: PARCIAL.getCode(), porcentaje };
  }
  return { estadoCode: PENDIENTE.getCode(), porcentaje };
};
