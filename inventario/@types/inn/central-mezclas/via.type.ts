import { CtmType } from '@common/domain/types';

export type ViaCode = 1 | 2;

export class ViaType extends CtmType<ViaCode> {}

const CENTRAL = new ViaType(1, 'CENTRAL');
const PERIFERICA = new ViaType(2, 'PERIFERICA');

export function viaTypeFactory(code: ViaCode): ViaType {
  switch (code) {
    case 1:
      return CENTRAL;
    case 2:
      return PERIFERICA;
  }
}

export const VIAS_VALUES = [CENTRAL, PERIFERICA];

export const VIAS = { CENTRAL, PERIFERICA };
