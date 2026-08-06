import { CtmType } from '@common/domain/types';

export type TipoPagoCode = 1 | 2 | 3;

export class TipoPagoType extends CtmType<TipoPagoCode> {}

const ANTICIPO = new TipoPagoType(1, 'ANTICIPO');
const A_CREDITO = new TipoPagoType(2, 'A CREDITO');
const CREDIANTICIPO = new TipoPagoType(3, 'CREDIANTICIPO');

export function tipoPagoTypeFactory(code: TipoPagoCode): TipoPagoType {
  switch (code) {
    case 1: return ANTICIPO;
    case 2: return A_CREDITO;
    case 3: return CREDIANTICIPO;
  }
}

export const TIPOS_PAGO = { ANTICIPO, A_CREDITO, CREDIANTICIPO };

export const TIPOS_PAGO_VALUES = Object.values(TIPOS_PAGO);
