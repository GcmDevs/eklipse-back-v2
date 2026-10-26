import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type TipoOrdenDespachoCode = 0 | 1;

export class TipoOrdenDespachoType extends CtmType<TipoOrdenDespachoCode> {}

const GENERAL = new TipoOrdenDespachoType(0, 'GENERAL');
const CONSUMO = new TipoOrdenDespachoType(1, 'CONSUMO');

export const tipoOrdenDespachoTypeFactory = (
  code: TipoOrdenDespachoCode,
  throwErr = true
): TipoOrdenDespachoType => {
  switch (code) {
    case 0:
      return GENERAL;
    case 1:
      return CONSUMO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe tipo de orden de despacho con este codigo');
      else return DEFAULT_TYPE;
    }
  }
};

export const TIPOS_ORDEN_DESPACHO = { GENERAL, CONSUMO };

export const TIPOS_ORDEN_DESPACHO_VALUES = [GENERAL, CONSUMO];
