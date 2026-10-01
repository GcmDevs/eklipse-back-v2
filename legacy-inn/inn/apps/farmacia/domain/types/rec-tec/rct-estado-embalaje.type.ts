import { CtmType } from '@common/domain/types';

export type EstadosEmbalajeCode = 1 | 2 | 3;

export class EstadosEmbalajeType extends CtmType<EstadosEmbalajeCode> {}

const BUEN_ESTADO = new EstadosEmbalajeType(1, 'EN BUEN ESTADO');
const DETERIORADO = new EstadosEmbalajeType(2, 'DETERIORADO');
const ACEPTABLE = new EstadosEmbalajeType(3, 'ACEPTABLE');

export function estadosEmbalajeTypeFactory(code: EstadosEmbalajeCode): EstadosEmbalajeType {
  switch (code) {
    case 1:
      return BUEN_ESTADO;
    case 2:
      return DETERIORADO;
    case 3:
      return ACEPTABLE;
  }
}

export const ESTADOS_EMBALAJE = [BUEN_ESTADO, DETERIORADO, ACEPTABLE];

export const ESTADOS_EMBALAJE_VALUES = [BUEN_ESTADO, DETERIORADO, ACEPTABLE];
