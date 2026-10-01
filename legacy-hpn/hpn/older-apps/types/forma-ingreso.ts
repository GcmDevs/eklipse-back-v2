import { CtmType } from '@common/domain/types';

export type FormaIngresoCode = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

const NINGUNO = new CtmType<FormaIngresoCode>(-1, 'NINGUNO');
const URGENCIAS = new CtmType<FormaIngresoCode>(0, 'URGENCIAS');
const CONSULTA_EXTERNA = new CtmType<FormaIngresoCode>(1, 'CONSULTA EXTERNA');
const NACIDO_IPS = new CtmType<FormaIngresoCode>(2, 'NACIDO EN LA IPS');
const REMITIDO = new CtmType<FormaIngresoCode>(3, 'REMITIDO');
const HOSPITALIZACION_URGENCIAS = new CtmType<FormaIngresoCode>(4, 'HOSPITALIZACION DE URGENCIAS');
const HOSPITALIZACION = new CtmType<FormaIngresoCode>(5, 'HOSPITALIZACION');
const IMAGENES = new CtmType<FormaIngresoCode>(6, 'IMAGENES');
const LABORATORIO = new CtmType<FormaIngresoCode>(7, 'LABORATORIO');
const URGENCIA_GINECOLOGIA = new CtmType<FormaIngresoCode>(8, 'URGENCIA GINECOLOGIA');
const QUIROFANO = new CtmType<FormaIngresoCode>(9, 'QUIROFANO');
const CIRUGIA_AUMBULATORIA = new CtmType<FormaIngresoCode>(10, 'CIRUGIA AMBULATORIA');
const CIRUGIA_PROGRAMADA = new CtmType<FormaIngresoCode>(11, 'CIRUGIA PROGRAMADA');
const UCI_NEONATAL = new CtmType<FormaIngresoCode>(12, 'UCI NEONATAL');
const UCI_ADULTO = new CtmType<FormaIngresoCode>(13, 'UCI ADULTO');

export function formaIngresoFactory(code: FormaIngresoCode): CtmType<FormaIngresoCode> {
  switch (code) {
    case -1:
      return NINGUNO;
    case 0:
      return URGENCIAS;
    case 1:
      return CONSULTA_EXTERNA;
    case 2:
      return NACIDO_IPS;
    case 3:
      return REMITIDO;
    case 4:
      return HOSPITALIZACION_URGENCIAS;
    case 5:
      return HOSPITALIZACION;
    case 6:
      return IMAGENES;
    case 7:
      return LABORATORIO;
    case 8:
      return URGENCIA_GINECOLOGIA;
    case 9:
      return QUIROFANO;
    case 10:
      return CIRUGIA_AUMBULATORIA;
    case 11:
      return CIRUGIA_PROGRAMADA;
    case 12:
      return UCI_NEONATAL;
    case 13:
      return UCI_ADULTO;
  }
}

export const FORMAS_INGRESO_VALUES = [
  NINGUNO,
  URGENCIAS,
  CONSULTA_EXTERNA,
  NACIDO_IPS,
  REMITIDO,
  HOSPITALIZACION_URGENCIAS,
  HOSPITALIZACION,
  IMAGENES,
  LABORATORIO,
  URGENCIA_GINECOLOGIA,
  QUIROFANO,
  CIRUGIA_AUMBULATORIA,
  CIRUGIA_PROGRAMADA,
  UCI_NEONATAL,
  UCI_ADULTO,
];

export const FORMAS_INGRESO = {
  NINGUNO,
  URGENCIAS,
  CONSULTA_EXTERNA,
  NACIDO_IPS,
  REMITIDO,
  HOSPITALIZACION_URGENCIAS,
  HOSPITALIZACION,
  IMAGENES,
  LABORATORIO,
  URGENCIA_GINECOLOGIA,
  QUIROFANO,
  CIRUGIA_AUMBULATORIA,
  CIRUGIA_PROGRAMADA,
  UCI_NEONATAL,
  UCI_ADULTO,
};
