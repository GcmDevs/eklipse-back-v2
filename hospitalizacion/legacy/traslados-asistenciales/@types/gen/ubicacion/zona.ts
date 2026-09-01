import { CtmType } from '@common/domain/types';

export type ZonaCode = 0 | 1 | 2;

const NINGUNA = new CtmType<ZonaCode>(0, 'NINGUNA');
const URBANA = new CtmType<ZonaCode>(1, 'URBANA');
const RURAL = new CtmType<ZonaCode>(2, 'RURAL');

export function zonaTypeFactory(code: ZonaCode): CtmType<ZonaCode> {
  switch (code) {
    case 0:
      return NINGUNA;
    case 1:
      return URBANA;
    case 2:
      return RURAL;
  }
}

export const ZONAS_VALUES = [NINGUNA, URBANA, RURAL];

export const ZONAS = { NINGUNA, URBANA, RURAL };
