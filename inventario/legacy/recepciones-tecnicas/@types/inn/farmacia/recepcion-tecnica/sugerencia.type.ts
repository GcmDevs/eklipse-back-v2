import { CtmType } from '@common/domain/types';

export type SugerenciaCode = 1 | 2 | 4 | 5 | 6 | 7;

export class SugerenciaType extends CtmType<SugerenciaCode> {}

const UNIDAD_MEDIDA = new SugerenciaType(1, 'UNIDAD DE MEDIDA (CONCENTRACIÓN)');
const LABORATORIO = new SugerenciaType(2, 'LABORATORIO');
const PRESENTACION = new SugerenciaType(4, 'PRESENTACION');
const FORMA_FARMACEUTICA = new SugerenciaType(5, 'FORMA FARMACEUTICA');
const TRANSPORTADORA = new SugerenciaType(6, 'TRANSPORTADORA');
const VIDA_UTIL = new SugerenciaType(7, 'VIDA UTIL');

export function sugerenciaTypeFactory(code: SugerenciaCode): SugerenciaType {
  switch (code) {
    case 1:
      return UNIDAD_MEDIDA;
    case 2:
      return LABORATORIO;
    case 4:
      return PRESENTACION;
    case 5:
      return FORMA_FARMACEUTICA;
    case 6:
      return TRANSPORTADORA;
    case 7:
      return VIDA_UTIL;
  }
}

export const SUGERENCIAS = {
  UNIDAD_MEDIDA,
  LABORATORIO,
  PRESENTACION,
  FORMA_FARMACEUTICA,
  TRANSPORTADORA,
  VIDA_UTIL,
};

export const SUGERENCIAS_VALUES = [
  UNIDAD_MEDIDA,
  LABORATORIO,
  PRESENTACION,
  FORMA_FARMACEUTICA,
  TRANSPORTADORA,
  VIDA_UTIL,
];
