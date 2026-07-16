import { CtmType } from '@common/domain/types';

export type SeguimientoAccionCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const CONTACTO_EPS = new CtmType<SeguimientoAccionCode>(1, 'Contacto EPS / solicitud autorizacion');
const HOSPITAL_RECEPTOR = new CtmType<SeguimientoAccionCode>(2, 'Gestion con hospital receptor');
const TRABAJO_SOCIAL = new CtmType<SeguimientoAccionCode>(3, 'Visita Trabajo Social');
const ENTRENAMIENTO_CUIDADOR = new CtmType<SeguimientoAccionCode>(4, 'Entrenamiento al cuidador');
const ICBF_BIENESTAR = new CtmType<SeguimientoAccionCode>(5, 'Solicitud ICBF / Bienestar Social');
const DIRECCION_MEDICA = new CtmType<SeguimientoAccionCode>(6, 'Escalada a Direccion Medica');
const COMITE_EGRESO = new CtmType<SeguimientoAccionCode>(7, 'Comite de egreso complejo');
const OTRA = new CtmType<SeguimientoAccionCode>(8, 'Otra');

export function seguimientoAccionTypeFactory(
  code: SeguimientoAccionCode
): CtmType<SeguimientoAccionCode> {
  switch (code) {
    case 1:
      return CONTACTO_EPS;
    case 2:
      return HOSPITAL_RECEPTOR;
    case 3:
      return TRABAJO_SOCIAL;
    case 4:
      return ENTRENAMIENTO_CUIDADOR;
    case 5:
      return ICBF_BIENESTAR;
    case 6:
      return DIRECCION_MEDICA;
    case 7:
      return COMITE_EGRESO;
    case 8:
      return OTRA;
  }
}

export const SEGUIMIENTO_ACCION_VALUES = [
  CONTACTO_EPS,
  HOSPITAL_RECEPTOR,
  TRABAJO_SOCIAL,
  ENTRENAMIENTO_CUIDADOR,
  ICBF_BIENESTAR,
  DIRECCION_MEDICA,
  COMITE_EGRESO,
  OTRA,
];

export const SEGUIMIENTO_ACCION = {
  CONTACTO_EPS,
  HOSPITAL_RECEPTOR,
  TRABAJO_SOCIAL,
  ENTRENAMIENTO_CUIDADOR,
  ICBF_BIENESTAR,
  DIRECCION_MEDICA,
  COMITE_EGRESO,
  OTRA,
};
