import { CtmType } from '@common/domain/types';

export type TipoIngresosCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

const URGENCIA = new CtmType<TipoIngresosCode>(0, 'URGENCIAS');
const CONSULTA_EXTERNA = new CtmType<TipoIngresosCode>(1, 'CONSULTA EXTERNA');
const NACIDO_HOSPI = new CtmType<TipoIngresosCode>(2, 'NACIDO HOSPITAL');
const REMITIDO = new CtmType<TipoIngresosCode>(3, 'REMITIDO');
const HOSPI_URGENCIA = new CtmType<TipoIngresosCode>(4, 'HOSPI URGENCIAS');
const HOSPITALIZACION = new CtmType<TipoIngresosCode>(5, 'HOSPITALIZACION');
const IMAGENES = new CtmType<TipoIngresosCode>(6, 'IMAGENES');
const LABORATORIO = new CtmType<TipoIngresosCode>(7, 'LABORATORIO');
const URGENCIA_GINECOLOGIA = new CtmType<TipoIngresosCode>(8, 'URGENCIA GINECOLOGIA');
const QUIROFANO = new CtmType<TipoIngresosCode>(9, 'QUIROFANO');
const CIRUGIA_AUMBULATORIA = new CtmType<TipoIngresosCode>(10, 'CIRUGIA AUMBULATORIA');
const CIRUGIA_PROGRAMADA = new CtmType<TipoIngresosCode>(11, 'CIRUGIA PROGRAMADA');
const UCI_NEONATAL = new CtmType<TipoIngresosCode>(12, 'UCI NEONATAL');
const UCI_ADULTO = new CtmType<TipoIngresosCode>(13, 'UCI ADULTO');

export function tipoIngresosFactory(code: TipoIngresosCode): CtmType<TipoIngresosCode> {
  switch (code) {
    case 0:
      return URGENCIA;
    case 1:
      return CONSULTA_EXTERNA;
    case 2:
      return NACIDO_HOSPI;
    case 3:
      return REMITIDO;
    case 4:
      return HOSPI_URGENCIA;
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

export const TIPO_INGRESOS_VALUES = [
  URGENCIA,
  CONSULTA_EXTERNA,
  NACIDO_HOSPI,
  REMITIDO,
  HOSPI_URGENCIA,
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

export const TIPO_INGRESOS = {
  URGENCIA,
  CONSULTA_EXTERNA,
  NACIDO_HOSPI,
  REMITIDO,
  HOSPI_URGENCIA,
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
