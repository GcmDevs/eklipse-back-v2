import { DEFAULT_TYPE, CtmType } from '@common/domain/types';
import {
  AFN_MTO_CASE_SER_TEC_VALUES,
  AFN_TIC_CASE_SER_TEC_VALUES,
  AfnClaseSerTecType,
} from './tipos.type';

export * from './tipos.type';

export type AfnTipoSerTecCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 247
  | 248
  | 249
  | 250;

export class AfnTipoSerTecType extends CtmType<AfnTipoSerTecCode> {}

export const AFNTIPO_SER_REC_TEC__SEEALL = new AfnTipoSerTecType(247, 'VER TODOS LOS CASOS');
export const AFNTIPO_SER_REC_TEC__ATCSNA = new AfnTipoSerTecType(248, 'ATENDER CASOS NO ASIGNADOS');
export const AFNTIPO_SER_REC_TEC__ASIGNAR__ = new AfnTipoSerTecType(249, 'ASIGNAR CASOS');
export const AFNTIPO_SER_REC_TEC__TODOS__ = new AfnTipoSerTecType(250, 'TODOS');

const TIC = new AfnTipoSerTecType(1, 'TICS');
const ING_BIOMEDICA = new AfnTipoSerTecType(2, 'ING. BIOMEDICA');
const MANTENIMIENTO = new AfnTipoSerTecType(3, 'MANTENIMIENTO');
const COMUNICACIONES = new AfnTipoSerTecType(4, 'COMUNICACIONES');
const GESTION_AMBIENTAL = new AfnTipoSerTecType(5, 'GESTIÓN AMBIENTAL');
const CALIDAD = new AfnTipoSerTecType(6, 'CALIDAD');
const HOTELERIA_HOSPITALARIA = new AfnTipoSerTecType(7, 'HOTELERIA HOSPITALARIA');
const SEGURIDAD = new AfnTipoSerTecType(8, 'SEGURIDAD');
const ACTIVO_FIJO = new AfnTipoSerTecType(9, 'ACTIVO FIJO');
const DIRECCION_RIESGO = new AfnTipoSerTecType(10, 'DIRECCIÓN DE RIESGOS');
const TALENTO_HUMANO = new AfnTipoSerTecType(11, 'TALENTO HUMANO');
const FACTURACION = new AfnTipoSerTecType(12, 'FACTURACIÓN');
const RADICACION = new AfnTipoSerTecType(13, 'RADICACIÓN');
const CONTABILIDAD = new AfnTipoSerTecType(14, 'CONTABILIDAD');
const CONTRATACION = new AfnTipoSerTecType(15, 'CONTRATACIÓN');
/* AGREGADAS RECIENTEMENTE */
const EMERGENCIA = new AfnTipoSerTecType(16, 'AMS EMERGENCIA');
const IMAGENOLOGIA = new AfnTipoSerTecType(17, 'IMAGENOLOGÍA');
const CADENA_DE_VALOR = new AfnTipoSerTecType(18, 'CADENA DE VALOR');
const CARTERA = new AfnTipoSerTecType(19, 'CARTERA');
const TESORERIA = new AfnTipoSerTecType(20, 'TESORERÍA');
const PROYECTOS_UNIVERSITARIOS = new AfnTipoSerTecType(21, 'PROYECTOS UNIVERSITARIOS');
const JURIDICA = new AfnTipoSerTecType(22, 'JURÍDICA');
const COORD_ADMIN_FINAN = new AfnTipoSerTecType(23, 'COORDINACIÓN ADMINISTRATIVA Y FINANCIERA');

export function afnTipoSerTecTypeFactory(
  code: AfnTipoSerTecCode,
  thowErr = true
): AfnTipoSerTecType {
  switch (code) {
    case 247:
      return AFNTIPO_SER_REC_TEC__SEEALL;
    case 248:
      return AFNTIPO_SER_REC_TEC__ATCSNA;
    case 249:
      return AFNTIPO_SER_REC_TEC__ASIGNAR__;
    case 250:
      return AFNTIPO_SER_REC_TEC__TODOS__;
    case 1:
      return TIC;
    case 2:
      return ING_BIOMEDICA;
    case 3:
      return MANTENIMIENTO;
    case 4:
      return COMUNICACIONES;
    case 5:
      return GESTION_AMBIENTAL;
    case 6:
      return CALIDAD;
    case 7:
      return HOTELERIA_HOSPITALARIA;
    case 8:
      return SEGURIDAD;
    case 9:
      return ACTIVO_FIJO;
    case 10:
      return DIRECCION_RIESGO;
    case 11:
      return TALENTO_HUMANO;
    case 12:
      return FACTURACION;
    case 13:
      return RADICACION;
    case 14:
      return CONTABILIDAD;
    case 15:
      return CONTRATACION;
    case 16:
      return EMERGENCIA;
    case 17:
      return IMAGENOLOGIA;
    case 18:
      return CADENA_DE_VALOR;
    case 19:
      return CARTERA;
    case 20:
      return TESORERIA;
    case 21:
      return PROYECTOS_UNIVERSITARIOS;
    case 22:
      return JURIDICA;
    case 23:
      return COORD_ADMIN_FINAN;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (thowErr) throw new Error('No existe tipo de servicio tecnico con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const AFN_TIPO_SER_TEC_VALUES = [
  TIC,
  ING_BIOMEDICA,
  MANTENIMIENTO,
  COMUNICACIONES,
  GESTION_AMBIENTAL,
  CALIDAD,
  HOTELERIA_HOSPITALARIA,
  SEGURIDAD,
  ACTIVO_FIJO,
  DIRECCION_RIESGO,
  TALENTO_HUMANO,
  FACTURACION,
  RADICACION,
  CONTABILIDAD,
  CONTRATACION,
  EMERGENCIA,
  IMAGENOLOGIA,
  CADENA_DE_VALOR,
  CARTERA,
  TESORERIA,
  PROYECTOS_UNIVERSITARIOS,
  JURIDICA,
  COORD_ADMIN_FINAN,
];

export const AFN_TIPO_SER_TEC = {
  TIC,
  ING_BIOMEDICA,
  MANTENIMIENTO,
  COMUNICACIONES,
  GESTION_AMBIENTAL,
  CALIDAD,
  HOTELERIA_HOSPITALARIA,
  SEGURIDAD,
  ACTIVO_FIJO,
  DIRECCION_RIESGO,
  TALENTO_HUMANO,
  FACTURACION,
  RADICACION,
  CONTABILIDAD,
  CONTRATACION,
  EMERGENCIA,
  IMAGENOLOGIA,
  CADENA_DE_VALOR,
  CARTERA,
  TESORERIA,
  PROYECTOS_UNIVERSITARIOS,
  JURIDICA,
  COORD_ADMIN_FINAN,
};
