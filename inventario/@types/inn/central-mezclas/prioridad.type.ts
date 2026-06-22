import { CtmType } from '@common/domain/types';

export type PrioridadCode = 1 | 2 | 3 | 4;

export class PrioridadType extends CtmType<PrioridadCode> {}

const BAJA = new PrioridadType(1, 'BAJA');
const MEDIA = new PrioridadType(2, 'MEDIA');
const ALTA = new PrioridadType(3, 'ALTA');
const CRITICA = new PrioridadType(4, 'CRITICA');

export function prioridadTypeFactory(code: PrioridadCode): PrioridadType {
  switch (code) {
    case 1:
      return BAJA;
    case 2:
      return MEDIA;
    case 3:
      return ALTA;
    case 4:
      return CRITICA;
  }
}

export const PRIORIDADES_VALUES = [BAJA, MEDIA, ALTA, CRITICA];

export const PRIORIDADES = { BAJA, MEDIA, ALTA, CRITICA };
