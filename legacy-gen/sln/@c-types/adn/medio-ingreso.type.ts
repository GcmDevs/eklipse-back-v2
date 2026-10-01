import { CtmType } from '@common/domain/types';

export type MedioIngresoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export class MedioIngresoType extends CtmType<MedioIngresoCode> {}

const URGENCIAS = new MedioIngresoType(0, 'URGENCIAS');
const CONSULTA_EXTERNA = new MedioIngresoType(1, 'CONSULTA EXTERNA');
const NACIDO_HOSPITAL = new MedioIngresoType(2, 'NACIDO HOSPITAL');
const REMITIDO = new MedioIngresoType(3, 'REMITIDO');
const HOSP_URGENCIAS = new MedioIngresoType(4, 'HOSP_URGENCIAS');
const HOSPITALIZACION = new MedioIngresoType(5, 'HOSPITALIZACION');
const IMAGENES = new MedioIngresoType(6, 'IMAGENES');
const LABORATORIO = new MedioIngresoType(7, 'LABORATORIO');
const URGENCIA_GINECOLOGICA = new MedioIngresoType(8, 'URGENCIA GINECOLOGICA');
const QUIROFANO = new MedioIngresoType(9, 'QUIROFANO');
const CIRUGIA_AMBULATORIA = new MedioIngresoType(10, 'CIRUGIA AMBULATORIA');
const CIRUGIA_PROGRAMADA = new MedioIngresoType(11, 'CIRUGIA PROGRAMADA');
const UCI_NEONATAL = new MedioIngresoType(12, 'UCI NEONATAL');
const UCI_ADULTO = new MedioIngresoType(13, 'UCI ADULTO');

export function medioIngresoTypeFactory(code: MedioIngresoCode): MedioIngresoType {
  switch (code) {
    case 0:
      return URGENCIAS;
    case 1:
      return CONSULTA_EXTERNA;
    case 2:
      return NACIDO_HOSPITAL;
    case 3:
      return REMITIDO;
    case 4:
      return HOSP_URGENCIAS;
    case 5:
      return HOSPITALIZACION;
    case 6:
      return IMAGENES;
    case 7:
      return LABORATORIO;
    case 8:
      return URGENCIA_GINECOLOGICA;
    case 9:
      return QUIROFANO;
    case 10:
      return CIRUGIA_AMBULATORIA;
    case 11:
      return CIRUGIA_PROGRAMADA;
    case 12:
      return UCI_NEONATAL;
    case 13:
      return UCI_ADULTO;
  }
}

export const MEDIOS_INGRESO_VALUES = [
  URGENCIAS,
  CONSULTA_EXTERNA,
  NACIDO_HOSPITAL,
  REMITIDO,
  HOSP_URGENCIAS,
  HOSPITALIZACION,
  IMAGENES,
  LABORATORIO,
  URGENCIA_GINECOLOGICA,
  QUIROFANO,
  CIRUGIA_AMBULATORIA,
  CIRUGIA_PROGRAMADA,
  UCI_NEONATAL,
  UCI_ADULTO,
];

export const MEDIOS_INGRESO = {
  URGENCIAS,
  CONSULTA_EXTERNA,
  NACIDO_HOSPITAL,
  REMITIDO,
  HOSP_URGENCIAS,
  HOSPITALIZACION,
  IMAGENES,
  LABORATORIO,
  URGENCIA_GINECOLOGICA,
  QUIROFANO,
  CIRUGIA_AMBULATORIA,
  CIRUGIA_PROGRAMADA,
  UCI_NEONATAL,
  UCI_ADULTO,
};
