import { DEFAULT_TYPE, CtmType } from '@common/domain/types';

export type EstadoEstanteCode = 1 | 2 | 3;

export class EstadoEstanteType extends CtmType<EstadoEstanteCode> {}

const SIN_CONTEO = new EstadoEstanteType(1, 'SIN CONTEO');
const SIN_VERIFICACION = new EstadoEstanteType(2, 'SIN VERIFICACION');
const VERIFICADO = new EstadoEstanteType(3, 'VERIFICADO');

export function estadoEstanteTypeFactory(
  code: EstadoEstanteCode,
  thowErr = true
): EstadoEstanteType {
  switch (code) {
    case 1:
      return SIN_CONTEO;
    case 2:
      return SIN_VERIFICACION;
    case 3:
      return VERIFICADO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (thowErr) throw new Error('No existe estado de estante con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ESTADOS_ESTANTE_VALUES = [SIN_CONTEO, SIN_VERIFICACION, VERIFICADO];

export const ESTADOS_ESTANTE = { SIN_CONTEO, SIN_VERIFICACION, VERIFICADO };
