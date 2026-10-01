import { CtmType } from '@common/domain/types';

export type TipoIngresoCode = 0 | 1 | 2;

const NINGUNO = new CtmType<TipoIngresoCode>(0, 'NINGUNO');
const AMBULATORIO = new CtmType<TipoIngresoCode>(1, 'AMBULATORIO');
const HOSPITALARIO = new CtmType<TipoIngresoCode>(2, 'HOSPITALARIO');

export function tipoIngresoFactory(code: TipoIngresoCode): CtmType<TipoIngresoCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return AMBULATORIO;
    case 2:
      return HOSPITALARIO;
  }
}

export const TIPOS_INGRESO_VALUES = [NINGUNO, AMBULATORIO, HOSPITALARIO];

export const TIPOS_INGRESO = {
  NINGUNO,
  AMBULATORIO,
  HOSPITALARIO,
};
