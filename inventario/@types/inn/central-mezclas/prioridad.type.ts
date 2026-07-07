import { CtmType } from '@common/domain/types';

export type PrioridadCode = 1 | 2 | 3 | 4;

export class PrioridadType extends CtmType<PrioridadCode> {}

const BAJA = new PrioridadType(1, 'BAJA');
const MEDIA = new PrioridadType(2, 'MEDIA');
const ALTA = new PrioridadType(3, 'ALTA');

export function prioridadTypeFactory(code: PrioridadCode): PrioridadType {
  switch (code) {
    case 1:
      return BAJA;
    case 2:
      return MEDIA;
    case 3:
      return ALTA;
  }
}

export const PRIORIDADES_VALUES = [ALTA, MEDIA, BAJA];

export const PRIORIDADES = { ALTA, MEDIA, BAJA };
