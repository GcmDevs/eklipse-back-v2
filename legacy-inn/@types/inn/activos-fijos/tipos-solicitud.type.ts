import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type AfnTipoSolSerTecCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export class AfnTipoSolSerTecType extends CtmType<AfnTipoSolSerTecCode> {}

const REQUERIMIENTO = new AfnTipoSolSerTecType(1, 'REQUERIMIENTO');
const INCIDENCIA = new AfnTipoSolSerTecType(2, 'INCIDENCIA');
const NO_APLICA = new AfnTipoSolSerTecType(3, 'NO APLICA');
const DESCONOCIMIENTO_EQUIPO = new AfnTipoSolSerTecType(4, 'DESCONOCIMIENTO DEL MANEJO DEL EQUIPO');
const DEFICIENCIA_PROCESO = new AfnTipoSolSerTecType(5, 'DEFICIENCIA DEL PROCESO');
const MANTENIMIENTO_CORRECTIVO = new AfnTipoSolSerTecType(6, 'MTO CORRECTIVO');
const RESPUESTA_REQUERIMIENTO = new AfnTipoSolSerTecType(7, 'RESPUESTA REQUERIMIENTO');
const DESCONOCIMIENTO_PROCESO = new AfnTipoSolSerTecType(8, 'DESCONOCIMIENTO DEL PROCESO');

export function afnTipoSolSerTecTypeFactory(
  code: AfnTipoSolSerTecCode,
  thowErr = true
): AfnTipoSolSerTecType {
  switch (code) {
    case 1:
      return REQUERIMIENTO;
    case 2:
      return INCIDENCIA;
    case 3:
      return NO_APLICA;
    case 4:
      return DESCONOCIMIENTO_EQUIPO;
    case 5:
      return DEFICIENCIA_PROCESO;
    case 6:
      return MANTENIMIENTO_CORRECTIVO;
    case 7:
      return RESPUESTA_REQUERIMIENTO;
    case 8:
      return DESCONOCIMIENTO_PROCESO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (thowErr) throw new Error('No existe tipo de solicitud con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const AFN_TIPO_SOL_SER_TEC_VALUES = [REQUERIMIENTO, INCIDENCIA, NO_APLICA];

export const AFN_TIPO_SOL_SER_TEC = {
  REQUERIMIENTO,
  INCIDENCIA,
  NO_APLICA,
};

export const AFN_TIPO_SOL_SER_TEC_CORREGIDO_VALUES = [
  DESCONOCIMIENTO_EQUIPO,
  DESCONOCIMIENTO_PROCESO,
  MANTENIMIENTO_CORRECTIVO,
  DEFICIENCIA_PROCESO,
  RESPUESTA_REQUERIMIENTO,
  NO_APLICA,
];

export const AFN_TIPO_SOL_SER_TEC_CORREGIDO = {
  DESCONOCIMIENTO_EQUIPO,
  DESCONOCIMIENTO_PROCESO,
  MANTENIMIENTO_CORRECTIVO,
  DEFICIENCIA_PROCESO,
  RESPUESTA_REQUERIMIENTO,
  NO_APLICA,
};
