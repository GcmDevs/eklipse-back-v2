import { CtmType } from '@common/domain/types';

export type EstadoRadicacionCode = -1 | 0 | 1 | 2 | 3 | null;

export class EstadoRadicacionType extends CtmType<EstadoRadicacionCode> {}

const NO_REGISTRADO = new EstadoRadicacionType(-1, 'NO REGISTRADA');
const REGISTRADO = new EstadoRadicacionType(0, 'REGISTRADA');
const CONFIRMADO = new EstadoRadicacionType(1, 'CONFIRMADA');
const RADICADO_ENTIDAD = new EstadoRadicacionType(2, 'RADICADA ENTIDAD');
const ANULADO = new EstadoRadicacionType(3, 'ANULADA');
const SIN_VALOR = new EstadoRadicacionType(null, 'SIN ESTADO ASIGNADO');

export const estadoRadicacionTypeFactory = (tipo: EstadoRadicacionCode) => {
  switch (tipo) {
    case -1:
      return NO_REGISTRADO;
    case 0:
      return REGISTRADO;
    case 1:
      return CONFIRMADO;
    case 2:
      return RADICADO_ENTIDAD;
    case 3:
      return ANULADO;
    case null:
      return SIN_VALOR;
  }
};

export const ESTADOS_RADICACION = {
  NO_REGISTRADO,
  REGISTRADO,
  CONFIRMADO,
  RADICADO_ENTIDAD,
  ANULADO,
  SIN_VALOR,
};

export const ESTADOS_RADICACION_VALUES = [
  NO_REGISTRADO,
  REGISTRADO,
  CONFIRMADO,
  RADICADO_ENTIDAD,
  ANULADO,
  SIN_VALOR,
];
