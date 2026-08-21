import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type EstadoProductosCode = 1 | 2 | 3 | 4;

export class EstadoProductosType extends CtmType<EstadoProductosCode> {}

const NORMAL = new EstadoProductosType(1, 'NORMAL');
const CRITICA = new EstadoProductosType(2, 'CRITICA');
const ALTA = new EstadoProductosType(3, 'ALTA');

export function estadoProductosTypeFactory(
  code: EstadoProductosCode,
  throwErr = true
): EstadoProductosType {
  switch (code) {
    case 1:
      return NORMAL;
    case 2:
      return CRITICA;
    case 3:
      return ALTA;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return DEFAULT_TYPE;
      else if (throwErr) throw new Error('No existe estado con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ESTADOS_PRODUCTOS = {
  NORMAL,
  CRITICA,
  ALTA,
};

export const ESTADOS_PRODUCTOS_VALUES = [NORMAL, CRITICA, ALTA];

export const ESTADOS_PRODUCTOS_CODES = ESTADOS_PRODUCTOS_VALUES.map(estado => estado.getCode());
