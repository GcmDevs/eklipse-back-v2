import { CtmType } from '@common/domain/types';

export type PacTrazEncEstadoCode = 1 | 2 | 3;

export class PacTrazEncEstadoType extends CtmType<PacTrazEncEstadoCode> {}

const PENDIENTE = new PacTrazEncEstadoType(1, 'PENDIENTE');
const EN_REVISION = new PacTrazEncEstadoType(2, 'EN REVISION');
const FINALIZADA = new PacTrazEncEstadoType(3, 'FINALIZADA');

export function pacTrazEncEstadoTypeFactory(code: PacTrazEncEstadoCode): PacTrazEncEstadoType {
  switch (code) {
    case 1:
      return PENDIENTE;
    case 2:
      return EN_REVISION;
    case 3:
      return FINALIZADA;
  }
}

export const PAC_TRAZ_ENC_ESTADOS_VALUES = [PENDIENTE, EN_REVISION, FINALIZADA];
