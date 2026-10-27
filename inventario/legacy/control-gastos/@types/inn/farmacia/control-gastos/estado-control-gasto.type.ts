import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type EstadoControlGastoCode = 6 | 7 | 1 | 2 | 3 | 4 | 5;

export class EstadoControlGastoType extends CtmType<EstadoControlGastoCode> {}

const INICIADO = new EstadoControlGastoType(6, 'INICIADO');
const ORDEN_AGREGADA = new EstadoControlGastoType(7, 'ORDEN AGREGADA');
const PENDIENTE = new EstadoControlGastoType(1, 'PENDIENTE');
const EN_TRAMITE = new EstadoControlGastoType(2, 'EN TRAMITE');
const PRODU_FACT = new EstadoControlGastoType(3, 'PRODUCTOS POR FACTURAR');
const FINALIZADO = new EstadoControlGastoType(4, 'FINALIZADO');
const RECHAZADO = new EstadoControlGastoType(5, 'RECHAZADO');

export function estadoControlGastoTypeFactory(
  code: EstadoControlGastoCode,
  throwErr = true
): EstadoControlGastoType {
  switch (code) {
    case 6:
      return INICIADO;
    case 1:
      return PENDIENTE;
    case 7:
      return ORDEN_AGREGADA;
    case 2:
      return EN_TRAMITE;
    case 3:
      return PRODU_FACT;
    case 4:
      return FINALIZADO;
    case 5:
      return RECHAZADO;
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

export const ESTADOS_CONTROL_GASTO_VALUES = Object.values(ESTADOS_CONTROL_GASTO);

export const ESTADOS_AL_CONCILIAR_CODES = [
  PRODU_FACT.getCode(),
  FINALIZADO.getCode(),
  INICIADO.getCode(),
];
