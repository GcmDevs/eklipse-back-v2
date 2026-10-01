import { CtmType } from '@common/domain/types';

export type CausaIngresoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

const NINGUNA = new CtmType<CausaIngresoCode>(0, 'NINGUNA');
const ENFERMEDAD_PROFESIONAL = new CtmType<CausaIngresoCode>(1, 'ENFERMEDAD PROFESIONAL');
const HERIDOS_COMBATE = new CtmType<CausaIngresoCode>(2, 'HERIDOS EN COMBATE');
const ENFERMEDAD_GENERAL_ADULTO = new CtmType<CausaIngresoCode>(3, 'ENFERMEDAD GENERAL DE ADULTO');
const ENFERMEDAD_GENERAL_PEDIATRIA = new CtmType<CausaIngresoCode>(
  4,
  'ENFERMEDAD GENERAL DE PEDIATRIA'
);
const ODONTOLOGIA = new CtmType<CausaIngresoCode>(5, 'ODONTOLOGIA');
const ACCIDENTE_TRANSITO = new CtmType<CausaIngresoCode>(6, 'ACCIDENTE DE TRANSITO');
const CATASTROFE_FISALUD = new CtmType<CausaIngresoCode>(7, 'CATASTROFE DE FISALUD');
const QUEMADOS = new CtmType<CausaIngresoCode>(8, 'QUEMADOS');
const MATERNIDAD = new CtmType<CausaIngresoCode>(9, 'MATERNIDAD');
const ACCIDENTE_LABORAL = new CtmType<CausaIngresoCode>(10, 'ACCIDENTE LABORAL');
const CIRUGIA_PROGRAMADA = new CtmType<CausaIngresoCode>(11, 'CIRUGIA PROGRAMADA');

export function causaIngresoFactory(code: CausaIngresoCode): CtmType<CausaIngresoCode> {
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
