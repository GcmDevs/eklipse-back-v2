import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type RiesgoSanitarioProductoCode = 0 | 1 | 2 | 3;

export class RiesgoSanitarioProductoType extends CtmType<RiesgoSanitarioProductoCode> {}

const NINGUNA = new RiesgoSanitarioProductoType(0, 'NINGUNA');
const I = new RiesgoSanitarioProductoType(1, 'CATEGORIA I');
const II = new RiesgoSanitarioProductoType(2, 'CATEGORIA II');
const III = new RiesgoSanitarioProductoType(3, 'CATEGORIA III');

export function riesgoSanitarioProductoTypeFactory(
  code: RiesgoSanitarioProductoCode,
  throwErr = true
): RiesgoSanitarioProductoType {
  switch (code) {
    case 0:
      return NINGUNA;
    case 1:
      return I;
    case 2:
      return II;
    case 3:
      return III;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe riesgo sanitario con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const RIESGOS_SANITARIOS_PRODUCTO = { NINGUNA, I, II, III };

export const RIESGOS_SANITARIOS_PRODUCTO_VALUES = [NINGUNA, I, II, III];
