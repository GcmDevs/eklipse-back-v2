import { CtmType } from '@common/domain/types';

export type DestinoEgresoCode = 1 | 2 | 3 | 4 | 5;

export class DestinoEgresoType extends CtmType<DestinoEgresoCode> {}

const EVENTO_ADVERSO_PREVENIBLE = new DestinoEgresoType(1, 'AMBULATORIO');
const EVENTO_ADVERSO_NO_PREVENIBLE = new DestinoEgresoType(2, 'EGRESO CONDICIONADO');
const INCIDENTE = new DestinoEgresoType(3, 'FALLECIDO');
const COMPLICACION = new DestinoEgresoType(4, 'FUGA');
const CENTINELA = new DestinoEgresoType(5, 'SALIDA VOLUNTARIA');

export function destinoEgresoTypeFactory(code: DestinoEgresoCode): DestinoEgresoType {
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

export const DESTINO_EGRESO_VALUES = [
  EVENTO_ADVERSO_PREVENIBLE,
  EVENTO_ADVERSO_NO_PREVENIBLE,
  INCIDENTE,
  COMPLICACION,
  CENTINELA,
];

export const DESTINO_EGRESO = {
  EVENTO_ADVERSO_PREVENIBLE,
  EVENTO_ADVERSO_NO_PREVENIBLE,
  INCIDENTE,
  COMPLICACION,
  CENTINELA,
};
