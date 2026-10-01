import { CtmType } from '@common/domain/types';

export type CondicionOfertaCode = 1 | 2 | 3 | 4;

export class CondicionOfertaType extends CtmType<CondicionOfertaCode> {}

const SINGL = new CondicionOfertaType(1, 'SELECCIÓN UNICA');
const MULTI = new CondicionOfertaType(2, 'SELECCIÓN MULTIPLE');
const SINGL_OPCIO = new CondicionOfertaType(3, 'SELECCIÓN UNICA (OPCIONAL)');
const MULTI_OPCIO = new CondicionOfertaType(2, 'SELECCIÓN MULTIPLE (OPCIONAL)');

export function condicionOfertaTypeFactory(code: CondicionOfertaCode): CondicionOfertaType {
  switch (code) {
    case 1:
      return SINGL;
    case 2:
      return MULTI;
    case 3:
      return SINGL_OPCIO;
    case 4:
      return MULTI_OPCIO;
  }
}

export const CONDICION_OFERTA = {
  SINGL,
  MULTI,
  SINGL_OPCIO,
  MULTI_OPCIO,
};

export const CONDICION_OFERTA_VALUES = [SINGL, MULTI, SINGL_OPCIO, MULTI_OPCIO];
