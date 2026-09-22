import {
  SOL_ESTADOS,
  SOL_ESTADOS_VALUES,
  SolEstadoCode,
  solEstadoTypeFactory,
} from '../_deprecated';
import { EstadoType } from './code';

export function estadoTypeFactory(code: SolEstadoCode): EstadoType {
  return solEstadoTypeFactory(code as SolEstadoCode);
}

export const ESTADOS = { ...SOL_ESTADOS };

export const ESTADOS_VALUES = [...SOL_ESTADOS_VALUES];
