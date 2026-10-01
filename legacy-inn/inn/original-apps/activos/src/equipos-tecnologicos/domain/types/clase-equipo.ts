import { CtmType } from '@common/domain/types';

export type ClasePcCode = 1 | 2;

export class ClasePcType extends CtmType<ClasePcCode> {}

const all_in_one = new ClasePcType(1, 'COMPUTARDOR DE ESCRITORIO ALL IN ONE');
const pc_torre = new ClasePcType(2, 'COMPUTARDOR DE ESCRITORIO TORRE');

export function clasePcTypeFactory(code: ClasePcCode): ClasePcType {
  switch (code) {
    case 1:
      return all_in_one;
    case 2:
      return pc_torre;
  }
}

export const CLASE_PC_ESCRITORIO = { all_in_one, pc_torre };

export const CLASE_PC_ESCRITORIO_VALUES = [all_in_one, pc_torre];
