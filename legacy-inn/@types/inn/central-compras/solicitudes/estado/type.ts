import { SOL_ESTADOS, SOL_ESTADOS_VALUES, solEstadoTypeFactory } from '../_deprecated';
import { EstadoCode, EstadoType } from './code';

const REGISTRADA = new EstadoType(101, 'REGISTRADO');

export function estadoTypeFactory(code: EstadoCode): EstadoType {
  if (code <= 100) return solEstadoTypeFactory(code as EstadoCode);
  switch (code) {
    case 101:
      return REGISTRADA;
  }
}

export const ESTADOS = { ...SOL_ESTADOS, REGISTRADA };

export const ESTADOS_VALUES = [...SOL_ESTADOS_VALUES, REGISTRADA];
