import { CtmType } from '@common/domain/types';

export type NacionalidadCode = 0 | 1 | 2;

const NINGUNA = new CtmType<NacionalidadCode>(0, 'NINGUNA');
const NACIONAL = new CtmType<NacionalidadCode>(1, 'NACIONAL');
const EXTERIOR = new CtmType<NacionalidadCode>(2, 'EXTERIOR');

export function nacionalidadTypeFactory(code: NacionalidadCode): CtmType<NacionalidadCode> {
  switch (code) {
    case 0:
      return NINGUNA;
    case 1:
      return NACIONAL;
    case 2:
      return EXTERIOR;
  }
}

export const NACIONALIDADES_VALUES = [NINGUNA, NACIONAL, EXTERIOR];

export const NACIONALIDADES = { NINGUNA, NACIONAL, EXTERIOR };
