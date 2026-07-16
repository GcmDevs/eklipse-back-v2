import { CtmType } from '@common/domain/types';

export type CierreProtocoloSuficienteCode = 1 | 2 | 3;

const SI = new CtmType<CierreProtocoloSuficienteCode>(1, 'si');
const PARCIAL = new CtmType<CierreProtocoloSuficienteCode>(2, 'parcial');
const NO = new CtmType<CierreProtocoloSuficienteCode>(3, 'no');

export function cierreProtocoloSuficienteTypeFactory(
  code: CierreProtocoloSuficienteCode
): CtmType<CierreProtocoloSuficienteCode> {
  switch (code) {
    case 1:
      return SI;
    case 2:
      return PARCIAL;
    case 3:
      return NO;
  }
}

export const CIERRE_PROTOCOLO_SUFICIENTE_VALUES = [SI, PARCIAL, NO];

export const CIERRE_PROTOCOLO_SUFICIENTE = {
  SI,
  PARCIAL,
  NO,
};
