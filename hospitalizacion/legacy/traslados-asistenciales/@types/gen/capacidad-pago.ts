import { CtmType } from '@common/domain/types';

export type CapacidadPagoCode = 0 | 1 | 2 | 3;

const NINGUNO = new CtmType<CapacidadPagoCode>(0, 'NINGUNO');
const SI = new CtmType<CapacidadPagoCode>(1, 'SI');
const NO = new CtmType<CapacidadPagoCode>(2, 'NO');
const DESPLAZADO = new CtmType<CapacidadPagoCode>(3, 'DESPLAZADO');

export function capacidadPagoTypeFactory(code: CapacidadPagoCode): CtmType<CapacidadPagoCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return SI;
    case 2:
      return NO;
    case 3:
      return DESPLAZADO;
  }
}

export const CAPACIDADES_PAGO_VALUES = [NINGUNO, SI, NO, DESPLAZADO];

export const CAPACIDADES_PAGO = { NINGUNO, SI, NO, DESPLAZADO };
