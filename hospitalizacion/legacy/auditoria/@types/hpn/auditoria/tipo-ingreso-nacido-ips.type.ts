import { CtmType } from '@common/domain/types';

export type TipoIngreNacIPSCode = 1 | 2 | 3 | 4 | 5;

export class TipoIngreNacIPSType extends CtmType<TipoIngreNacIPSCode> {}

const BAJO_PESO = new TipoIngreNacIPSType(1, 'BAJO PESO');
const METABOLICO = new TipoIngreNacIPSType(2, 'METABOLICO');
const PREMATURO = new TipoIngreNacIPSType(3, 'PREMATURO');
const INFECCIOSO = new TipoIngreNacIPSType(4, 'INFECCIOSO');
const TRAST_ADAPTATIVO = new TipoIngreNacIPSType(5, 'TRAST ADAPTATIVO');

export function tipoIngreNacIPSTypeFactory(code: TipoIngreNacIPSCode): TipoIngreNacIPSType {
  switch (code) {
    case 1:
      return BAJO_PESO;
    case 2:
      return METABOLICO;
    case 3:
      return PREMATURO;
    case 4:
      return INFECCIOSO;
    case 5:
      return TRAST_ADAPTATIVO;
    default:
      throw new Error('No existe tipo de ingreso con este codigo');
  }
}

export const TIPO_ING_NACIDO_IPS_VALUES = [
  BAJO_PESO,
  METABOLICO,
  PREMATURO,
  INFECCIOSO,
  TRAST_ADAPTATIVO,
];

export const TIPO_ING_NACIDO_IPS = {
  BAJO_PESO,
  METABOLICO,
  PREMATURO,
  INFECCIOSO,
  TRAST_ADAPTATIVO,
};
