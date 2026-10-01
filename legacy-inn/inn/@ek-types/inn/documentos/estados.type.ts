import { CtmType } from '@common/domain/types';

export type EstadoDocumentoCode = -1 | 0 | 1 | 2;

export class EstadoDocumentoType extends CtmType<EstadoDocumentoCode> {}

const NO_REGISTRADO = new EstadoDocumentoType(-1, 'NO REGISTRADO');
const REGISTRADO = new EstadoDocumentoType(0, 'REGISTRADO');
const CONFIRMADO = new EstadoDocumentoType(1, 'CONFIRMADO');
const ANULADO = new EstadoDocumentoType(2, 'ANULADO');

export function estadoDocumentoTypeFactory(code: EstadoDocumentoCode): EstadoDocumentoType {
  switch (code) {
    case -1:
      return NO_REGISTRADO;
    case 0:
      return REGISTRADO;
    case 1:
      return CONFIRMADO;
    case 2:
      return ANULADO;
  }
}

export const ESTADOS_DOCUMENTO_VALUES = [NO_REGISTRADO, REGISTRADO, CONFIRMADO, ANULADO];

export const ESTADOS_DOCUMENTO = {
  NO_REGISTRADO,
  REGISTRADO,
  CONFIRMADO,
  ANULADO,
};
