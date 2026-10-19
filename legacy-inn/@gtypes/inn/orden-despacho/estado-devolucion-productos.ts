import { CtmType } from '@common/domain/types';

export type EstadoDevolucionProductosTypeCode = 1 | 2 | 3;

export class EstadoDevolucionProductosType extends CtmType<EstadoDevolucionProductosTypeCode> {}

const SIN_MOVIMIENTO = new EstadoDevolucionProductosType(1, 'SIN MOVIMIENTO');
const PARCIAL = new EstadoDevolucionProductosType(2, 'PARCIAL');
const TOTAL = new EstadoDevolucionProductosType(3, 'TOTAL');

export function estadoDevolucionProductosTypeFactory(
  code: EstadoDevolucionProductosTypeCode
): EstadoDevolucionProductosType {
  switch (code) {
    case 1:
      return SIN_MOVIMIENTO;
    case 2:
      return PARCIAL;
    case 3:
      return TOTAL;
  }
}

export const ESTADO_DEVOLUCION_PRODUCTOS = { SIN_MOVIMIENTO, PARCIAL, TOTAL };
export const ESTADO_DEVOLUCION_PRODUCTOS_VALUES = [SIN_MOVIMIENTO, PARCIAL, TOTAL];
