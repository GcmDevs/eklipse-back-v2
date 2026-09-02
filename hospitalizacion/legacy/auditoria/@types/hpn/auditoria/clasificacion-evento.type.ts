import { CtmType } from '@common/domain/types';

export type ClasificacionEventoCode = 1 | 2 | 3 | 4 | 5;

export class ClasificacionEventoType extends CtmType<ClasificacionEventoCode> {}

const EVENTO_ADVERSO_PREVENIBLE = new ClasificacionEventoType(1, 'EVENTO ADVERSO PREVENIBLE');
const EVENTO_ADVERSO_NO_PREVENIBLE = new ClasificacionEventoType(2, 'EVENTO ADVERSO NO PREVENIBLE');
const INCIDENTE = new ClasificacionEventoType(3, 'INCIDENTE');
const COMPLICACION = new ClasificacionEventoType(4, 'COMPLICACION');
const CENTINELA = new ClasificacionEventoType(5, 'CENTINELA');

export function ClasificacionEventoTypeFactory(
  code: ClasificacionEventoCode
): ClasificacionEventoType {
  switch (code) {
    case 1:
      return EVENTO_ADVERSO_PREVENIBLE;
    case 2:
      return EVENTO_ADVERSO_NO_PREVENIBLE;
    case 3:
      return INCIDENTE;
    case 4:
      return COMPLICACION;
    case 5:
      return CENTINELA;
    default:
      throw new Error('No existe tipo de ingreso con este codigo');
  }
}

export const CLASIFICACION_EVENTO_VALUES = [
  EVENTO_ADVERSO_PREVENIBLE,
  EVENTO_ADVERSO_NO_PREVENIBLE,
  INCIDENTE,
  COMPLICACION,
  CENTINELA,
];

export const CLASIFICACION_EVENTO = {
  EVENTO_ADVERSO_PREVENIBLE,
  EVENTO_ADVERSO_NO_PREVENIBLE,
  INCIDENTE,
  COMPLICACION,
  CENTINELA,
};
