import { CtmType } from '@common/domain/types';

export type UnidadCode = 1 | 2 | 3;

export class UnidadType extends CtmType<UnidadCode> {}

const MG = new UnidadType(1, 'mg');
const MCG = new UnidadType(2, 'µg');
const UI = new UnidadType(3, 'UI');

export function unidadTypeFactory(code: UnidadCode): UnidadType {
  switch (code) {
    case 1:
      return MG;
    case 2:
      return MCG;
    case 3:
      return UI;
  }
}

export const UNIDADES_VALUES = [MG, MCG, UI];

export const UNIDADES = { MG, MCG, UI };
