import { CtmType } from '@common/domain/types';

export type TipoCamas = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const NINGUNO = new CtmType<TipoCamas>(0, 'NINGUNO');
const CAMAS = new CtmType<TipoCamas>(1, 'CAMAS');
const CAMILLAS = new CtmType<TipoCamas>(2, 'CAMILLAS');
const CUNAS = new CtmType<TipoCamas>(3, 'CUNAS');
const INCUBADORAS = new CtmType<TipoCamas>(4, 'INCUBADORAS');
const SILLONES_EXC = new CtmType<TipoCamas>(5, 'SILLONES EXC');
const CAMAS_EXC = new CtmType<TipoCamas>(6, 'CAMAS EXC');

export function tipoCamaFactory(code: TipoCamas): CtmType<TipoCamas> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return CAMAS;
    case 2:
      return CAMILLAS;
    case 3:
      return CUNAS;
    case 4:
      return INCUBADORAS;
    case 5:
      return SILLONES_EXC;
    case 6:
      return CAMAS_EXC;
  }
}

export const TIPO_CAMAS_VALUES = [
  NINGUNO,
  CAMAS,
  CAMILLAS,
  CUNAS,
  INCUBADORAS,
  SILLONES_EXC,
  CAMAS_EXC,
];
export const TIPO_CAMAS = {
  NINGUNO,
  CAMAS,
  CAMILLAS,
  CUNAS,
  INCUBADORAS,
  SILLONES_EXC,
  CAMAS_EXC,
};
