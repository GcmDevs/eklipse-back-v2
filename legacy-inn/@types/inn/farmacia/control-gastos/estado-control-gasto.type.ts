import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type EstadoControlGastoCode = 1 | 2 | 3 | 4 | 5 | 6;

export class EstadoControlGastoType extends CtmType<EstadoControlGastoCode> {}

const PENDIENTE = new EstadoControlGastoType(1, 'PENDIENTE');
const EN_TRAMITE = new EstadoControlGastoType(2, 'EN TRAMITE');
const PRODU_FACT = new EstadoControlGastoType(3, 'PRODUCTOS POR FACTURAR');
const FINALIZADO = new EstadoControlGastoType(4, 'FINALIZADO');
const RECHAZADO = new EstadoControlGastoType(5, 'RECHAZADO');
const INICIADO = new EstadoControlGastoType(6, 'INICIADO');

export function estadoControlGastoTypeFactory(
  code: EstadoControlGastoCode,
  throwErr = true
): EstadoControlGastoType {
  switch (code) {
    case 1:
      return PENDIENTE;
    case 2:
      return EN_TRAMITE;
    case 3:
      return PRODU_FACT;
    case 4:
      return FINALIZADO;
    case 5:
      return RECHAZADO;
    case 6:
      return INICIADO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe estado con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ESTADOS_CONTROL_GASTO = {
  PENDIENTE,
  EN_TRAMITE,
  RECHAZADO,
  PRODU_FACT,
  FINALIZADO,
  INICIADO,
};

export const ESTADOS_CONTROL_GASTO_VALUES = [
  PENDIENTE,
  EN_TRAMITE,
  PRODU_FACT,
  FINALIZADO,
  INICIADO,
];

export const ESTADOS_AL_CONCILIAR_CODES = [
  PRODU_FACT.getCode(),
  FINALIZADO.getCode(),
  INICIADO.getCode(),
];
