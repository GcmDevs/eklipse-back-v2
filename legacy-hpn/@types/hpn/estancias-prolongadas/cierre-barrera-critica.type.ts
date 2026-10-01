import { CtmType } from '@common/domain/types';

export type CierreBarreraCriticaCode = 1 | 2 | 3 | 4 | 5;

const CLINICA = new CtmType<CierreBarreraCriticaCode>(1, 'clinica');
const SOCIAL = new CtmType<CierreBarreraCriticaCode>(2, 'social');
const SISTEMA = new CtmType<CierreBarreraCriticaCode>(3, 'sistema');
const GEOGRAFICA = new CtmType<CierreBarreraCriticaCode>(4, 'geografica');
const MULTIPLE = new CtmType<CierreBarreraCriticaCode>(5, 'multiple');

export function cierreBarreraCriticaTypeFactory(
  code: CierreBarreraCriticaCode
): CtmType<CierreBarreraCriticaCode> {
  switch (code) {
    case 1:
      return CLINICA;
    case 2:
      return SOCIAL;
    case 3:
      return SISTEMA;
    case 4:
      return GEOGRAFICA;
    case 5:
      return MULTIPLE;
  }
}

export const CIERRE_BARRERA_CRITICA_VALUES = [CLINICA, SOCIAL, SISTEMA, GEOGRAFICA, MULTIPLE];

export const CIERRE_BARRERA_CRITICA = {
  CLINICA,
  SOCIAL,
  SISTEMA,
  GEOGRAFICA,
  MULTIPLE,
};
