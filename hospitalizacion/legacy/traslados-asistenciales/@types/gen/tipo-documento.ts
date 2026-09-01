import { CtmType } from '@common/domain/types';

export type TipoDocumentoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const NINGUNO = new CtmType<TipoDocumentoCode>(0, 'NINGUNO');
const CEDULA_CIUDADANIA = new CtmType<TipoDocumentoCode>(1, 'CÉDULA DE CIUDADANÍA');
const CEDULA_EXTRANJERIA = new CtmType<TipoDocumentoCode>(2, 'CÉDULA EXTRANJERÍA');
const TARJETA_IDENTIDAD = new CtmType<TipoDocumentoCode>(3, 'TARJETA DE IDENTIDAD');
const REGISTRO_CIVIL = new CtmType<TipoDocumentoCode>(4, 'REGISTRO CIVÍL');
const PASAPORTE = new CtmType<TipoDocumentoCode>(5, 'PASAPORTE');
const ADULTO_SIN_IDENTIFICACION = new CtmType<TipoDocumentoCode>(6, 'ADULTO SIN IDENTIFICACIÓN');
const MENOR_SIN_IDENTIFICACION = new CtmType<TipoDocumentoCode>(7, 'MENOR SIN IDENTIFICACIÓN');
const NUMERO_UNICO_IDENTIFICACION = new CtmType<TipoDocumentoCode>(
  8,
  'NÚMERO UNICO IDENTIFICACIÓN'
);
const SALVOCONDUCTO = new CtmType<TipoDocumentoCode>(9, 'SALVOCONDUCTO');
const CERTIFICADO_NACIDO_VIVO = new CtmType<TipoDocumentoCode>(10, 'CERTIFICADO NACIDO VIVO');
const CARNE_DIPLOMATICO = new CtmType<TipoDocumentoCode>(11, 'CARNÉ DIPLOMÁTICO');
const PERMISO_ESPECIAL_PERMANENCIA = new CtmType<TipoDocumentoCode>(
  12,
  'PERMISO ESPECIAL PERMANENCIA'
);

export function tipoDocumentoTypeFactory(code: TipoDocumentoCode): CtmType<TipoDocumentoCode> {
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
