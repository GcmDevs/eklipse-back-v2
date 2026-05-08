import { CtmType } from '@common/domain/types';

export type FormaIngresoCode = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export class FormaIngresoType extends CtmType<FormaIngresoCode> {}

const NINGUNO = new FormaIngresoType(-1, 'NINGUNO');
const URGENCIAS = new FormaIngresoType(0, 'URGENCIAS');
const CONSULTA_EXTERNA = new FormaIngresoType(1, 'CONSULTA EXTERNA');
const NACIDO_IPS = new FormaIngresoType(2, 'NACIDO EN LA IPS');
const REMITIDO = new FormaIngresoType(3, 'REMITIDO');
const HOSPITALIZACION_URGENCIAS = new FormaIngresoType(4, 'HOSPITALIZACION DE URGENCIAS');
const HOSPITALIZACION = new FormaIngresoType(5, 'HOSPITALIZACION');
const IMAGENES = new FormaIngresoType(6, 'IMAGENES');
const LABORATORIO = new FormaIngresoType(7, 'LABORATORIO');
const URGENCIA_GINECOLOGIA = new FormaIngresoType(8, 'URGENCIA GINECOLOGIA');
const QUIROFANO = new FormaIngresoType(9, 'QUIROFANO');
const CIRUGIA_AUMBULATORIA = new FormaIngresoType(10, 'CIRUGIA AMBULATORIA');
const CIRUGIA_PROGRAMADA = new FormaIngresoType(11, 'CIRUGIA PROGRAMADA');
const UCI_NEONATAL = new FormaIngresoType(12, 'UCI NEONATAL');
const UCI_ADULTO = new FormaIngresoType(13, 'UCI ADULTO');

export function formaIngresoTypeFactory(code: FormaIngresoCode): FormaIngresoType {
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
