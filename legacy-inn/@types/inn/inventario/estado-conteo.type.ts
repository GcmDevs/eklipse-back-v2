import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type EstadoConteoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export class EstadoConteoType extends CtmType<EstadoConteoCode> {}

const EN_PROGRESO = new EstadoConteoType(0, 'EN PROGRESO');
const COMPLETADO = new EstadoConteoType(1, 'COMPLETADO');
const AJUSTADO = new EstadoConteoType(2, 'AJUSTADO');
const SOBRANTE = new EstadoConteoType(3, 'SOBRANTE');
const FALTANTE = new EstadoConteoType(4, 'FALTANTE');
const VERIFICAR = new EstadoConteoType(5, 'VERIFICAR');
const PENDIENTE = new EstadoConteoType(6, 'PENDIENTE');

export function estadoConteoTypeFactory(code: EstadoConteoCode, throwErr = true): EstadoConteoType {
  switch (code) {
    case 0:
      return EN_PROGRESO;
    case 1:
      return COMPLETADO;
    case 2:
      return AJUSTADO;
    case 3:
      return SOBRANTE;
    case 4:
      return FALTANTE;
    case 5:
      return VERIFICAR;
    case 6:
      return PENDIENTE;

    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe rol de usuario de conteos con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ESTADO_CONTEO = {
  EN_PROGRESO,
  COMPLETADO,
  AJUSTADO,
  SOBRANTE,
  FALTANTE,
  VERIFICAR,
  PENDIENTE,
};

export const ESTADO_CONTEO_VALUES = [
  EN_PROGRESO,
  COMPLETADO,
  AJUSTADO,
  SOBRANTE,
  FALTANTE,
  VERIFICAR,
  PENDIENTE,
];
