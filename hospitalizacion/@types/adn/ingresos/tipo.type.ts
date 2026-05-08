import { CtmType } from '@common/domain/types';

export type TipoIngresoCode = 0 | 1 | 2;

export class TipoIngresoType extends CtmType<TipoIngresoCode> {}

const NINGUNO = new TipoIngresoType(0, 'NINGUNO');
const AMBULATORIO = new TipoIngresoType(1, 'AMBULATORIO');
const HOSPITALARIO = new TipoIngresoType(2, 'HOSPITALARIO');

export function tipoIngresoTypeFactory(code: TipoIngresoCode): TipoIngresoType {
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

export const TIPOS_INGRESO = { NINGUNO, AMBULATORIO, HOSPITALARIO };
