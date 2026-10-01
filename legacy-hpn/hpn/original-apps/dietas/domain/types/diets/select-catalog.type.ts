import { CtmType } from '@common/domain/types';

export type SelectCatalogDietCode = 1 | 2 | 3 | 4;

export class SelectCatalogDietType extends CtmType<SelectCatalogDietCode> {}

const SINGL = new SelectCatalogDietType(1, 'SELECCIÓN UNICA');
const MULTI = new SelectCatalogDietType(2, 'SELECCIÓN MULTIPLE');
const SINGL_OPCIO = new SelectCatalogDietType(3, 'SELECCIÓN UNICA (OPCIONAL)');
const MULTI_OPCIO = new SelectCatalogDietType(2, 'SELECCIÓN MULTIPLE (OPCIONAL)');

export function selectcatalogDietTypeFactory(code: SelectCatalogDietCode): SelectCatalogDietType {
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

export const SELCATDI = {
  SINGL,
  MULTI,
  SINGL_OPCIO,
  MULTI_OPCIO,
};

export const SELCATDI_VALUES = [SINGL, MULTI, SINGL_OPCIO, MULTI_OPCIO];
