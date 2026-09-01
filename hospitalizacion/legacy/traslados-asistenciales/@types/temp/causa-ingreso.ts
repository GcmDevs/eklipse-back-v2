import { CtmType } from '@common/domain/types';

export type CausaIngresoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export class CausaIngresoType extends CtmType<CausaIngresoCode> {}

const NINGUNA = new CausaIngresoType(0, 'NINGUNA');
const ENFERMEDAD_PROFESIONAL = new CausaIngresoType(1, 'ENFERMEDAD PROFESIONAL');
const HERIDOS_COMBATE = new CausaIngresoType(2, 'HERIDOS EN COMBATE');
const ENFERMEDAD_GENERAL_ADULTO = new CausaIngresoType(3, 'ENFERMEDAD GENERAL DE ADULTO');
const ENFERMEDAD_GENERAL_PEDIATRIA = new CausaIngresoType(4, 'ENFERMEDAD GENERAL DE PEDIATRIA');
const ODONTOLOGIA = new CausaIngresoType(5, 'ODONTOLOGIA');
const ACCIDENTE_TRANSITO = new CausaIngresoType(6, 'ACCIDENTE DE TRANSITO');
const CATASTROFE_FISALUD = new CausaIngresoType(7, 'CATASTROFE DE FISALUD');
const QUEMADOS = new CausaIngresoType(8, 'QUEMADOS');
const MATERNIDAD = new CausaIngresoType(9, 'MATERNIDAD');
const ACCIDENTE_LABORAL = new CausaIngresoType(10, 'ACCIDENTE LABORAL');
const CIRUGIA_PROGRAMADA = new CausaIngresoType(11, 'CIRUGIA PROGRAMADA');

export function causaIngresoFactory(code: CausaIngresoCode): CausaIngresoType {
  switch (code) {
    case 0:
      return NINGUNA;
    case 1:
      return ENFERMEDAD_PROFESIONAL;
    case 2:
      return HERIDOS_COMBATE;
    case 3:
      return ENFERMEDAD_GENERAL_ADULTO;
    case 4:
      return ENFERMEDAD_GENERAL_PEDIATRIA;
    case 5:
      return ODONTOLOGIA;
    case 6:
      return ACCIDENTE_TRANSITO;
    case 7:
      return CATASTROFE_FISALUD;
    case 8:
      return QUEMADOS;
    case 9:
      return MATERNIDAD;
    case 10:
      return ACCIDENTE_LABORAL;
    case 11:
      return CIRUGIA_PROGRAMADA;
  }
}

export const CAUSAS_INGRESO_VALUES = [
  NINGUNA,
  ENFERMEDAD_PROFESIONAL,
  HERIDOS_COMBATE,
  ENFERMEDAD_GENERAL_ADULTO,
  ENFERMEDAD_GENERAL_PEDIATRIA,
  ODONTOLOGIA,
  ACCIDENTE_TRANSITO,
  CATASTROFE_FISALUD,
  QUEMADOS,
  MATERNIDAD,
  ACCIDENTE_LABORAL,
  CIRUGIA_PROGRAMADA,
];

export const CAUSAS_INGRESO = {
  NINGUNA,
  ENFERMEDAD_PROFESIONAL,
  HERIDOS_COMBATE,
  ENFERMEDAD_GENERAL_ADULTO,
  ENFERMEDAD_GENERAL_PEDIATRIA,
  ODONTOLOGIA,
  ACCIDENTE_TRANSITO,
  CATASTROFE_FISALUD,
  QUEMADOS,
  MATERNIDAD,
  ACCIDENTE_LABORAL,
  CIRUGIA_PROGRAMADA,
};
