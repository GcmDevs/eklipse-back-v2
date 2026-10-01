import { DEFAULT_TYPE, CtmType } from '@common/domain/types';

export type EstadoAfnActivoCode = 0 | 1 | 2 | 3 | 4;

export class EstadoAfnActivoType extends CtmType<EstadoAfnActivoCode> {}

const ACTIVO = new EstadoAfnActivoType(0, 'ACTIVO');
const INACTIVO = new EstadoAfnActivoType(1, 'INACTIVO');
const TOTALMENTE_DEPRECIADO = new EstadoAfnActivoType(2, 'TOTALMENTE DEPRECIADO');
const SALIDA = new EstadoAfnActivoType(3, 'SALIDA');
const DEVUELTO = new EstadoAfnActivoType(4, 'DEVUELTO');

export function estadoAfnActivoTypeFactory(
  code: EstadoAfnActivoCode,
  thowErr = true
): EstadoAfnActivoType {
  switch (code) {
    case 0:
      return ACTIVO;
    case 1:
      return INACTIVO;
    case 2:
      return TOTALMENTE_DEPRECIADO;
    case 3:
      return SALIDA;
    case 4:
      return DEVUELTO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (thowErr) throw new Error('No existe tipo de servicio tecnico con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ESTADOS_AFNACTIVO_VALUES = [ACTIVO, INACTIVO, TOTALMENTE_DEPRECIADO, SALIDA, DEVUELTO];

export const ESTADOS_AFNACTIVO = { ACTIVO, INACTIVO, TOTALMENTE_DEPRECIADO, SALIDA, DEVUELTO };
