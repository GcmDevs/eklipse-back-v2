import { CtmType } from '@common/domain/types';

export type GeneroCode = 0 | 1 | 2;

const NINGUNA = new CtmType<GeneroCode>(0, 'NINGUNA');
const MASCULINO = new CtmType<GeneroCode>(1, 'MASCULINO');
const FEMENINO = new CtmType<GeneroCode>(2, 'FEMENINO');

export function generoTypeFactory(code: GeneroCode): CtmType<GeneroCode> {
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
