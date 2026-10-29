import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type EstadoProductoOrdenDespachoCode = 0 | 1 | 2;

export class EstadoProductoOrdenDespachoType extends CtmType<EstadoProductoOrdenDespachoCode> {}

const SIN_MOVIMIENTO = new EstadoProductoOrdenDespachoType(0, 'SIN MOVIMIENTO');
const PARCIAL = new EstadoProductoOrdenDespachoType(1, 'PARCIAL');
const TOTAL = new EstadoProductoOrdenDespachoType(2, 'TOTAL');

export const estadosProductoOrdenDespachoTypeFactory = (
  code: EstadoProductoOrdenDespachoCode,
  throwErr = true
): EstadoProductoOrdenDespachoType => {
  switch (code) {
    case 0:
      return SIN_MOVIMIENTO;
    case 1:
      return PARCIAL;
    case 2:
      return TOTAL;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe estado de productos de OD con este codigo');
      else return DEFAULT_TYPE;
    }
  }
};

export const ESTADOS_PRODUCTO_ORDEN_DESPACHO = { SIN_MOVIMIENTO, PARCIAL, TOTAL };

export const ESTADOS_PRODUCTO_ORDEN_DESPACHO_VALUES = [SIN_MOVIMIENTO, PARCIAL, TOTAL];
