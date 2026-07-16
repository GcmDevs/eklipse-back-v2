import { CtmType } from '@common/domain/types';

export type CierreLosResultadoCode = 1 | 2 | 3 | 4 | 5;

const DENTRO = new CtmType<CierreLosResultadoCode>(1, 'dentro');
const MAYOR_CONTROLADO = new CtmType<CierreLosResultadoCode>(2, 'mayor_controlado');
const MAYOR_EVITABLE = new CtmType<CierreLosResultadoCode>(3, 'mayor_evitable');
const MAYOR_SOCIAL = new CtmType<CierreLosResultadoCode>(4, 'mayor_social');
const MAYOR_SISTEMA = new CtmType<CierreLosResultadoCode>(5, 'mayor_sistema');

export function cierreLosResultadoTypeFactory(
  code: CierreLosResultadoCode
): CtmType<CierreLosResultadoCode> {
  switch (code) {
    case 1:
      return DENTRO;
    case 2:
      return MAYOR_CONTROLADO;
    case 3:
      return MAYOR_EVITABLE;
    case 4:
      return MAYOR_SOCIAL;
    case 5:
      return MAYOR_SISTEMA;
  }
}

export const CIERRE_LOS_RESULTADO_VALUES = [
  DENTRO,
  MAYOR_CONTROLADO,
  MAYOR_EVITABLE,
  MAYOR_SOCIAL,
  MAYOR_SISTEMA,
];

export const CIERRE_LOS_RESULTADO = {
  DENTRO,
  MAYOR_CONTROLADO,
  MAYOR_EVITABLE,
  MAYOR_SOCIAL,
  MAYOR_SISTEMA,
};
