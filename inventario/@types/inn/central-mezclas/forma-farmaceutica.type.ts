import { CtmType } from '@common/domain/types';

export type FormaFarmaceuticaCode = 1 | 2 | 3 | 4;

export class FormaFarmaceuticaType extends CtmType<FormaFarmaceuticaCode> {}

const TABLETAS = new FormaFarmaceuticaType(1, 'TABLETAS');
const CAPSULAS = new FormaFarmaceuticaType(2, 'CAPSULAS');
const GRAGEAS = new FormaFarmaceuticaType(3, 'GRAGEAS');
const OVULOS = new FormaFarmaceuticaType(4, 'OVULOS');

export function formaFarmaceuticaTypeFactory(code: FormaFarmaceuticaCode): FormaFarmaceuticaType {
  switch (code) {
    case 1:
      return TABLETAS;
    case 2:
      return CAPSULAS;
    case 3:
      return GRAGEAS;
    case 4:
      return OVULOS;
  }
}

export const FORMAS_FARMACEUTICAS_VALUES = [TABLETAS, CAPSULAS, GRAGEAS, OVULOS];

export const FORMAS_FARMACEUTICAS = { TABLETAS, CAPSULAS, GRAGEAS, OVULOS };
