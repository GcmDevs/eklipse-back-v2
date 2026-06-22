import { CtmType } from '@common/domain/types';

export type EstadoCode = 1 | 2 | 3 | 4;

export class EstadoType extends CtmType<EstadoCode> {}

const RADICADA = new EstadoType(1, 'RADICADA');
const ACEPTADA = new EstadoType(2, 'ACEPTADA');
const RECHAZADA = new EstadoType(3, 'RECHAZADA');
const CANCELADA = new EstadoType(4, 'CANCELADA');

export function estadoTypeFactory(code: EstadoCode): EstadoType {
  switch (code) {
    case 1:
      return RADICADA;
    case 2:
      return ACEPTADA;
    case 3:
      return RECHAZADA;
    case 4:
      return CANCELADA;
  }
}

export const ESTADOS_VALUES = [RADICADA, ACEPTADA, RECHAZADA, CANCELADA];

export const ESTADOS = { RADICADA, ACEPTADA, RECHAZADA, CANCELADA };
