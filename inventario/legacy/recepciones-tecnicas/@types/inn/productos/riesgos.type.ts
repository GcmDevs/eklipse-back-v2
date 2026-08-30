import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type RiesgoProductoCode = 1 | 2 | 3 | 4 | 5 | 6;

export class RiesgoProductoType extends CtmType<RiesgoProductoCode> {}

const I = new RiesgoProductoType(1, 'I');
const II = new RiesgoProductoType(6, 'II');
const IIA = new RiesgoProductoType(2, 'IIA');
const IIB = new RiesgoProductoType(3, 'IIB');
const III = new RiesgoProductoType(4, 'III');
const NO_APLICA = new RiesgoProductoType(5, 'NO APLICA');

export function riesgoProductoTypeFactory(
  code: RiesgoProductoCode,
  throwErr = true
): RiesgoProductoType {
  switch (code) {
    case 1:
      return I;
    case 6:
      return II;
    case 2:
      return IIA;
    case 3:
      return IIB;
    case 4:
      return III;
    case 5:
      return NO_APLICA;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe riesgo con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const RIESGOS_PRODUCTO = { I, II, IIA, IIB, III, NO_APLICA };

export const RIESGOS_PRODUCTO_VALUES = [I, II, IIA, IIB, III, NO_APLICA];
