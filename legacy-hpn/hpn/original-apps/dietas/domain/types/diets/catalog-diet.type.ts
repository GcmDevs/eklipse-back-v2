import { CtmType } from '@common/domain/types';
import { SELCATDI, SelectCatalogDietType } from './select-catalog.type';

export type CatalogDietCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export class CatalogDietType extends CtmType<CatalogDietCode> {
  constructor(code: CatalogDietCode, forHumans: string, private type: SelectCatalogDietType) {
    super(code, forHumans);
  }

  getType(): SelectCatalogDietType {
    return this.type;
  }
}

const SINGL_TYPE = new CatalogDietType(1, 'TIPO (COMIDA)', SELCATDI.SINGL);
const MULTI_TYPE = new CatalogDietType(2, 'TIPO (COMIDA)', SELCATDI.MULTI);
const SINGL_CONSISTENCY = new CatalogDietType(3, 'CONSISTENCIA (COMIDA)', SELCATDI.SINGL);
const MULTI_CONSISTENCY = new CatalogDietType(4, 'CONSISTENCIA (COMIDA)', SELCATDI.MULTI);
const SINGL_DRINK_TYPE = new CatalogDietType(5, 'TIPO (BEBIDA)', SELCATDI.SINGL);
const MULTI_DRINK_TYPE = new CatalogDietType(6, 'TIPO (BEBIDA)', SELCATDI.MULTI);
const SINGL_DRINK_CONSISTENCY = new CatalogDietType(7, 'CONSISTENCIA (BEBIDA)', SELCATDI.SINGL);
const MULTI_DRINK_CONSISTENCY = new CatalogDietType(8, 'CONSISTENCIA (BEBIDA)', SELCATDI.MULTI);
const SINGLE_EXTRA_DIET_SNACKS = new CatalogDietType(
  9,
  'DIETA EXTRAORDINARIA (MERIENDA)',
  SELCATDI.SINGL
);
const EXTRA_DIET_PARENT_DIET = new CatalogDietType(
  10,
  'DIETA EXTRAORDINARIA (DIETA PARA FAMILIAR)',
  SELCATDI.SINGL_OPCIO
);

export function catalogDietTypeFactory(code: CatalogDietCode): CatalogDietType {
  switch (code) {
    case 1:
      return SINGL_TYPE;
    case 2:
      return MULTI_TYPE;
    case 3:
      return SINGL_CONSISTENCY;
    case 4:
      return MULTI_CONSISTENCY;
    case 5:
      return SINGL_DRINK_TYPE;
    case 6:
      return MULTI_DRINK_TYPE;
    case 7:
      return SINGL_DRINK_CONSISTENCY;
    case 8:
      return MULTI_DRINK_CONSISTENCY;
    case 9:
      return SINGLE_EXTRA_DIET_SNACKS;
    case 10:
      return EXTRA_DIET_PARENT_DIET;
  }
}

export const CATALOG_DIET = {
  SINGL_TYPE,
  SINGL_CONSISTENCY,
  MULTI_TYPE,
  MULTI_CONSISTENCY,
  SINGL_DRINK_TYPE,
  MULTI_DRINK_TYPE,
  SINGL_DRINK_CONSISTENCY,
  MULTI_DRINK_CONSISTENCY,
  SINGLE_EXTRA_DIET_SNACKS,
  EXTRA_DIET_PARENT_DIET,
};

export const CATALOG_DIET_VALUES = [
  SINGL_TYPE,
  SINGL_CONSISTENCY,
  MULTI_TYPE,
  MULTI_CONSISTENCY,
  SINGL_DRINK_TYPE,
  MULTI_DRINK_TYPE,
  SINGL_DRINK_CONSISTENCY,
  MULTI_DRINK_CONSISTENCY,
  SINGLE_EXTRA_DIET_SNACKS,
  EXTRA_DIET_PARENT_DIET,
];
