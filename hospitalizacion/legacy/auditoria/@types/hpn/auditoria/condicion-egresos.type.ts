import { CtmType } from '@common/domain/types';

export type CondicionEgresoCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export class CondicionEgresoType extends CtmType<CondicionEgresoCode> {}

const EVENTO_ADVERSO_PREVENIBLE = new CondicionEgresoType(1, 'ALBERGUE');
const EVENTO_ADVERSO_NO_PREVENIBLE = new CondicionEgresoType(2, 'ATENCION DOMICILIARIA');
const INCIDENTE = new CondicionEgresoType(3, 'CLINICA DE HERIDAS');
const COMPLICACION = new CondicionEgresoType(4, 'CUIDADO PALIATIVO');
const CENTINELA = new CondicionEgresoType(5, 'HOMECARE');
const REMISION = new CondicionEgresoType(6, 'REMISION');
const HOSPICASA = new CondicionEgresoType(7, 'HOSPICASA');
const HOSPICASA7 = new CondicionEgresoType(8, 'OXIGENO DOMICILIARIO');
const HOSPICASA8 = new CondicionEgresoType(9, 'SOPORTE NUTRICIONAL');
const HOSPICASA9 = new CondicionEgresoType(10, 'TRASLADO AMBULANCIA');
const HOSPICASA1 = new CondicionEgresoType(11, 'UNIDAD DE CUIDADO CRONICO');

export function condicionEgresoTypeFactory(code: CondicionEgresoCode): CondicionEgresoType {
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
    case 6:
      return REMISION;
    case 7:
      return HOSPICASA;
    case 8:
      return HOSPICASA7;
    case 9:
      return HOSPICASA8;
    case 10:
      return HOSPICASA9;
    case 11:
      return HOSPICASA1;
    default:
      throw new Error('No existe tipo de ingreso con este codigo');
  }
}

export const CONDICION_EGRESO_VALUES = [
  EVENTO_ADVERSO_PREVENIBLE,
  EVENTO_ADVERSO_NO_PREVENIBLE,
  INCIDENTE,
  COMPLICACION,
  CENTINELA,
  REMISION,
  HOSPICASA,
  HOSPICASA7,
  HOSPICASA8,
  HOSPICASA9,
  HOSPICASA1,
];

export const CONDICION_EGRESO = {
  EVENTO_ADVERSO_PREVENIBLE,
  EVENTO_ADVERSO_NO_PREVENIBLE,
  INCIDENTE,
  COMPLICACION,
  CENTINELA,
  REMISION,
  HOSPICASA,
  HOSPICASA7,
  HOSPICASA8,
  HOSPICASA9,
  HOSPICASA1,
};
