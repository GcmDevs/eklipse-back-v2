import {
  SOL_ESTADOS_ESPECIFICOS,
  SOL_ESTADOS_ESPECIFICOS_VALUES,
  SolEstadoEspecificoCode,
  solEstadoEspecificoTypeFactory,
} from '../_deprecated';
import { EstadoEspecificoType } from './code';

export function estadoEspecificoTypeFactory(code: SolEstadoEspecificoCode): EstadoEspecificoType {
  return solEstadoEspecificoTypeFactory(code as SolEstadoEspecificoCode);
}

export const ESTADOS_ESPECIFICOS = { ...SOL_ESTADOS_ESPECIFICOS };

export const ESTADOS_ESPECIFICOS_VALUES = [...SOL_ESTADOS_ESPECIFICOS_VALUES];
