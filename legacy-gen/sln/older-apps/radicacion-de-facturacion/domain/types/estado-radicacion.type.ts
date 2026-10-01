import { CtmType } from '@common/domain/types';

export type EstadoRadicacionCode = -1 | 0 | 1 | 2 | 3 | 4 | 99;

export class EstadoRadicacionType extends CtmType<EstadoRadicacionCode> {}

const noRegistrado = new EstadoRadicacionType(-1, 'NO REGISTRADO');
const registrado = new EstadoRadicacionType(0, 'REGISTRADO');
const confirmado = new EstadoRadicacionType(1, 'RADICADO');
const radicadoEntidad = new EstadoRadicacionType(2, 'RADICADO ENTIDAD');
const anulado = new EstadoRadicacionType(3, 'RADICADO ANULADO');
const noDefinido = new EstadoRadicacionType(4, 'NO DEFINIDO');
const noRadicado = new EstadoRadicacionType(99, 'FACTURA NO RADICADA');

export const estadoRadicacionTypeFactory = (value: EstadoRadicacionCode) => {
  switch (value) {
    case -1:
      return noRegistrado;
    case 0:
      return registrado;
    case 1:
      return confirmado;
    case 2:
      return radicadoEntidad;
    case 3:
      return anulado;
    case 4:
      return noDefinido;
    case 99:
      return noRadicado;
  }
};

export const ESTADOS_RADICACION = {
  noRegistrado,
  registrado,
  confirmado,
  radicadoEntidad,
  anulado,
  noDefinido,
  noRadicado,
};

export const ESTADO_RADICACION_TYPES = [
  noRegistrado,
  registrado,
  confirmado,
  radicadoEntidad,
  anulado,
  noDefinido,
  noRadicado,
];
