import { CtmType } from '@common/domain/types';

export type TipoOrdenDespachoTypeCode = 0 | 1;

export class TipoOrdenDespachoType extends CtmType<TipoOrdenDespachoTypeCode> {}

const GENERAL = new TipoOrdenDespachoType(0, 'GENERAL');
const CONSUMO = new TipoOrdenDespachoType(1, 'CONSUMO');

export function tipoOrdenDespachoTypeFactory(
  code: TipoOrdenDespachoTypeCode
): TipoOrdenDespachoType {
  switch (code) {
    case 0:
      return GENERAL;
    case 1:
      return CONSUMO;
  }
}

export const TIPOS_ORDEN_DESPACHO = { GENERAL, CONSUMO };
export const TIPOS_ORDEN_DESPACHO_VALUES = [GENERAL, CONSUMO];
