import {
  SOL_ESTADOS_ESPECIFICOS,
  SOL_ESTADOS_ESPECIFICOS_VALUES,
  solEstadoEspecificoTypeFactory,
} from '../_deprecated';
import { EstadoEspecificoCode, EstadoEspecificoType } from './code';

const REGISTRADA = new EstadoEspecificoType(101, 'SOLICITUD REGISTRADA');

export function estadoEspecificoTypeFactory(code: EstadoEspecificoCode): EstadoEspecificoType {
  if (code <= 100) {
    return solEstadoEspecificoTypeFactory(code as EstadoEspecificoCode);
  } else {
    switch (code) {
      case 101:
        return REGISTRADA;
    }
  }
}

export const ESTADOS_ESPECIFICOS = { ...SOL_ESTADOS_ESPECIFICOS, REGISTRADA };

export const ESTADOS_ESPECIFICOS_VALUES = [...SOL_ESTADOS_ESPECIFICOS_VALUES, REGISTRADA];
