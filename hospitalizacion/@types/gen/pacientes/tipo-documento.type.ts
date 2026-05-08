import { CtmType } from '@common/domain/types';

export type TipoDocumentoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export class TipoDocumentoType extends CtmType<TipoDocumentoCode> {}

const NINGUNO = new TipoDocumentoType(0, 'NINGUNO');
const CEDULA_CIUDADANIA = new TipoDocumentoType(1, 'CÉDULA CIUDADANÍA');
const CEDULA_EXTRANJERIA = new TipoDocumentoType(2, 'CÉDULA EXTRANJERÍA');
const TARJETA_IDENTIDAD = new TipoDocumentoType(3, 'TARJETA DE IDENTIDAD');
const REGISTRO_CIVIL = new TipoDocumentoType(4, 'REGISTRO CIVÍL');
const PASAPORTE = new TipoDocumentoType(5, 'PASAPORTE');
const ADULTO_SIN_IDENTIFICACION = new TipoDocumentoType(6, 'ADULTO SIN IDENTIFICACIÓN');
const MENOR_SIN_IDENTIFICACION = new TipoDocumentoType(7, 'MENOR SIN IDENTIFICACIÓN');
const NUMERO_UNICO_IDENTIFICACION = new TipoDocumentoType(8, 'NÚMERO UNICO IDENTIFICACIÓN');
const SALVOCONDUCTO = new TipoDocumentoType(9, 'SALVOCONDUCTO');
const CERTIFICADO_NACIDO_VIVO = new TipoDocumentoType(10, 'CERTIFICADO NACIDO VIVO');
const CARNE_DIPLOMATICO = new TipoDocumentoType(11, 'CARNÉ DIPLOMÁTICO');
const PERMISO_ESPECIAL_PERMANENCIA = new TipoDocumentoType(12, 'PERMISO ESPECIAL PERMANENCIA');

export function tipoDocumentoTypeFactory(code: TipoDocumentoCode): TipoDocumentoType {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return CEDULA_CIUDADANIA;
    case 2:
      return CEDULA_EXTRANJERIA;
    case 3:
      return TARJETA_IDENTIDAD;
    case 4:
      return REGISTRO_CIVIL;
    case 5:
      return PASAPORTE;
    case 6:
      return ADULTO_SIN_IDENTIFICACION;
    case 7:
      return MENOR_SIN_IDENTIFICACION;
    case 8:
      return NUMERO_UNICO_IDENTIFICACION;
    case 9:
      return SALVOCONDUCTO;
    case 10:
      return CERTIFICADO_NACIDO_VIVO;
    case 11:
      return CARNE_DIPLOMATICO;
    case 12:
      return PERMISO_ESPECIAL_PERMANENCIA;
    default:
      return NINGUNO;
  }
}

export const TIPOS_DOCUMENTO_VALUES = [
  NINGUNO,
  CEDULA_CIUDADANIA,
  CEDULA_EXTRANJERIA,
  TARJETA_IDENTIDAD,
  REGISTRO_CIVIL,
  PASAPORTE,
  ADULTO_SIN_IDENTIFICACION,
  MENOR_SIN_IDENTIFICACION,
  NUMERO_UNICO_IDENTIFICACION,
  SALVOCONDUCTO,
  CERTIFICADO_NACIDO_VIVO,
  CARNE_DIPLOMATICO,
  PERMISO_ESPECIAL_PERMANENCIA,
];

export const TIPOS_DOCUMENTO = {
  NINGUNO,
  CEDULA_CIUDADANIA,
  CEDULA_EXTRANJERIA,
  TARJETA_IDENTIDAD,
  REGISTRO_CIVIL,
  PASAPORTE,
  ADULTO_SIN_IDENTIFICACION,
  MENOR_SIN_IDENTIFICACION,
  NUMERO_UNICO_IDENTIFICACION,
  SALVOCONDUCTO,
  CERTIFICADO_NACIDO_VIVO,
  CARNE_DIPLOMATICO,
  PERMISO_ESPECIAL_PERMANENCIA,
};
