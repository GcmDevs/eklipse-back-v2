import { CtmType } from '@common/domain/types';

export type GeneroCode = 0 | 1 | 2;

export class GeneroType extends CtmType<GeneroCode> {}

const NINGUNA = new GeneroType(0, 'NINGUNA');
const MASCULINO = new GeneroType(1, 'MASCULINO');
const FEMENINO = new GeneroType(2, 'FEMENINO');

export function generoTypeFactory(code: GeneroCode): GeneroType {
  switch (code) {
    case 0:
      return NINGUNA;
    case 1:
      return MASCULINO;
    case 2:
      return FEMENINO;
  }
}

export const GENEROS_VALUES = [NINGUNA, MASCULINO, FEMENINO];

export const GENEROS = { NINGUNA, MASCULINO, FEMENINO };
