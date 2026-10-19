import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type TipoRequerimientoContratoSolSerTecCode = 1 | 2 | 3 | 4;

export class TipoRequerimientoContratoSolSerTecType extends CtmType<TipoRequerimientoContratoSolSerTecCode> {}

const PARAT_VALORES_CERO_COBERTURA = new TipoRequerimientoContratoSolSerTecType(
  1,
  'PARÁMETROS VALORES EN CERO O COBERTURA'
);
const NOVEDAD_PLAN_BENEFICIO_ACTIV_BLOQ = new TipoRequerimientoContratoSolSerTecType(
  2,
  'NOVEDADES EN EL PLAN DE BENEFICIO (ACTIVACIÓN, BLOQUEO)'
);
const NOVEDAD_CAMA = new TipoRequerimientoContratoSolSerTecType(3, 'NOVEDADES EN LAS CAMAS');
const OTRO_REQUERIMIENTO = new TipoRequerimientoContratoSolSerTecType(4, 'OTRO REQUERIMIENTO');

export function tipoRequerimientoContratoSolSerTecTypeFactory(
  code: TipoRequerimientoContratoSolSerTecCode,
  thowErr = true
): TipoRequerimientoContratoSolSerTecType {
  switch (code) {
    case 1:
      return PARAT_VALORES_CERO_COBERTURA;
    case 2:
      return NOVEDAD_PLAN_BENEFICIO_ACTIV_BLOQ;
    case 3:
      return NOVEDAD_CAMA;
    case 4:
      return OTRO_REQUERIMIENTO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (thowErr) throw new Error('No existe tipo de solicitud con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const TIPO_REQUERIMIENTO_CONTR_SOL_SER_TEC = {
  PARAT_VALORES_CERO_COBERTURA,
  NOVEDAD_PLAN_BENEFICIO_ACTIV_BLOQ,
  NOVEDAD_CAMA,
  OTRO_REQUERIMIENTO,
};

export const TIPO_REQUERIMIENTOS_CONTR_CON_INGRESO = [PARAT_VALORES_CERO_COBERTURA, NOVEDAD_CAMA];

export const TIPO_REQUERIMIENTOS_CONTR_SOL_SER_TEC_VALUES = [
  PARAT_VALORES_CERO_COBERTURA,
  NOVEDAD_PLAN_BENEFICIO_ACTIV_BLOQ,
  NOVEDAD_CAMA,
  OTRO_REQUERIMIENTO,
];
