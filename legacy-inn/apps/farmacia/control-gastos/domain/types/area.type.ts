import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type AreaCode = 1 | 2 | 3;

export class AreaType extends CtmType<AreaCode> {}

const HEMODINAMIA = new AreaType(1, 'HEMODINAMIA');
const CIRUGIA = new AreaType(2, 'CIRUGIA');
const MAOS = new AreaType(3, 'MAOS');

export function areaTypeFactory(code: AreaCode, thowErr = true): AreaType {
  switch (code) {
    case 1:
      return HEMODINAMIA;
    case 2:
      return CIRUGIA;
    case 3:
      return MAOS;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (thowErr) throw new Error('No existe estado de estante con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const AREA_VALUES = [HEMODINAMIA, CIRUGIA, MAOS];

export const AREA = { HEMODINAMIA, CIRUGIA, MAOS };
