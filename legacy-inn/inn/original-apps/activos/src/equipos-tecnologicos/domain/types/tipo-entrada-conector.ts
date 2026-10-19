import { CtmType } from '@common/domain/types';

export type TipoEntradaConectorCode = 1 | 2;

export class TipoEntradaConectorType extends CtmType<TipoEntradaConectorCode> {}

const usb = new TipoEntradaConectorType(1, 'USB');
const ps2 = new TipoEntradaConectorType(2, 'PS/2');

export function tipoEntradaConectorTypeFactory(
  code: TipoEntradaConectorCode
): TipoEntradaConectorType {
  switch (code) {
    case 1:
      return usb;
    case 2:
      return ps2;
  }
}

export const TIPO_ENTRADA_CONECTORES = { usb, ps2 };

export const TIPO_ENTRADA_CONECTORES_VALUES = [usb, ps2];
