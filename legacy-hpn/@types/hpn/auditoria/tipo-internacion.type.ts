import { CtmType } from '@common/domain/types';

export type TipoInternacionCode = 1 | 2 | 3 | 4;

export class TipoInternacionType extends CtmType<TipoInternacionCode> {}

const TIPO4 = new TipoInternacionType(4, 'URGENCIAS');
const TIPO1 = new TipoInternacionType(1, 'UCI');
const TIPO2 = new TipoInternacionType(2, 'INTERMEDIO');
const TIPO3 = new TipoInternacionType(3, 'BASICO');

export function tipoInternacionTypeFactory(code: TipoInternacionCode): TipoInternacionType {
  switch (code) {
    case 4:
      return TIPO4;
    case 1:
      return TIPO1;
    case 2:
      return TIPO2;
    case 3:
      return TIPO3;
  }
}

export const TIPO_INTERNACION_VALUES = [TIPO4, TIPO1, TIPO2, TIPO3];

export const TIPO_INTERNACION = { TIPO4, TIPO1, TIPO2, TIPO3 };
