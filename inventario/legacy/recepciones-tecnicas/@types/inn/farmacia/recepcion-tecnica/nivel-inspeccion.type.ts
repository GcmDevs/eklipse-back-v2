import { CtmType } from '@common/domain/types';

export type NivelInspeccionCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 99;

export class NivelInspeccionType extends CtmType<NivelInspeccionCode> {}

const NIVEL_NA = new NivelInspeccionType(99, 'N/A');
const NIVEL_A = new NivelInspeccionType(1, 'A');
const NIVEL_B = new NivelInspeccionType(2, 'B');
const NIVEL_C = new NivelInspeccionType(3, 'C');
const NIVEL_D = new NivelInspeccionType(4, 'D');
const NIVEL_E = new NivelInspeccionType(5, 'E');
const NIVEL_F = new NivelInspeccionType(6, 'F');
const NIVEL_G = new NivelInspeccionType(7, 'G');
const NIVEL_H = new NivelInspeccionType(8, 'H');
const NIVEL_J = new NivelInspeccionType(10, 'J');
const NIVEL_K = new NivelInspeccionType(11, 'K');
const NIVEL_L = new NivelInspeccionType(12, 'L');
const NIVEL_M = new NivelInspeccionType(13, 'M');
const NIVEL_N = new NivelInspeccionType(14, 'N');
const NIVEL_P = new NivelInspeccionType(15, 'P');
const NIVEL_Q = new NivelInspeccionType(16, 'Q');

export function nivelInspeccionTypeFactory(code: NivelInspeccionCode): NivelInspeccionType {
  switch (code) {
    case 99:
      return NIVEL_NA;
    case 1:
      return NIVEL_A;
    case 2:
      return NIVEL_B;
    case 3:
      return NIVEL_C;
    case 4:
      return NIVEL_D;
    case 5:
      return NIVEL_E;
    case 6:
      return NIVEL_F;
    case 7:
      return NIVEL_G;
    case 8:
      return NIVEL_H;
    case 10:
      return NIVEL_J;
    case 11:
      return NIVEL_K;
    case 12:
      return NIVEL_L;
    case 13:
      return NIVEL_M;
    case 14:
      return NIVEL_N;
    case 15:
      return NIVEL_P;
    case 16:
      return NIVEL_Q;
  }
}

export function nivelInspeccionTypeFactoryByChar(key: string): NivelInspeccionType {
  key = key.toUpperCase();

  switch (key) {
    case 'A':
      return NIVEL_A;
    case 'B':
      return NIVEL_B;
    case 'C':
      return NIVEL_C;
    case 'D':
      return NIVEL_D;
    case 'E':
      return NIVEL_E;
    case 'F':
      return NIVEL_F;
    case 'G':
      return NIVEL_G;
    case 'H':
      return NIVEL_H;
    case 'J':
      return NIVEL_J;
    case 'K':
      return NIVEL_K;
    case 'L':
      return NIVEL_L;
    case 'M':
      return NIVEL_M;
    case 'N':
      return NIVEL_N;
    case 'P':
      return NIVEL_P;
    case 'Q':
      return NIVEL_Q;
    case 'N/A':
      return NIVEL_NA;
    default:
      return NIVEL_NA;
  }
}

export const NIVEL_INSPECCION_VALUES = [
  NIVEL_A,
  NIVEL_B,
  NIVEL_C,
  NIVEL_D,
  NIVEL_E,
  NIVEL_F,
  NIVEL_G,
  NIVEL_H,
  NIVEL_J,
  NIVEL_K,
  NIVEL_L,
  NIVEL_M,
  NIVEL_N,
  NIVEL_P,
  NIVEL_Q,
  NIVEL_NA,
];
