import { CtmType } from '@common/domain/types';

export type MotivoDevolucionDietaCode = 1 | 2 | 3 | 4 | 5;

export class MotivoDevolucionDietaType extends CtmType<MotivoDevolucionDietaCode> {}

export const SALIDA_NO_REPORTADA = new MotivoDevolucionDietaType(1, 'SALIDA NO REPORTADA');
export const FALLECIMIENTO = new MotivoDevolucionDietaType(2, 'FALLECIMIENTO');
export const PROCEDIMIENTO_QUIRURGICO = new MotivoDevolucionDietaType(
  3,
  'PROCEDIMIENTO QUIRURGICO'
);
export const NO_LE_GUSTA = new MotivoDevolucionDietaType(4, 'NO LE GUSTÓ');
export const DIETA_NO_ADECUADA = new MotivoDevolucionDietaType(5, 'DIETA NO ADECUADA');

export function motivosDevolucionDietaTypeFactory(
  code: MotivoDevolucionDietaCode
): MotivoDevolucionDietaType {
  switch (code) {
    case 1:
      return SALIDA_NO_REPORTADA;
    case 2:
      return FALLECIMIENTO;
    case 3:
      return PROCEDIMIENTO_QUIRURGICO;
    case 4:
      return NO_LE_GUSTA;
    case 5:
      return DIETA_NO_ADECUADA;
  }
}

export const MOTIVOS_DEVOLUCION_DIETA = {
  SALIDA_NO_REPORTADA,
  FALLECIMIENTO,
  PROCEDIMIENTO_QUIRURGICO,
  NO_LE_GUSTA,
  DIETA_NO_ADECUADA,
};

export const MOTIVOS_DEVOLUCION_DIETA_VALUES = [
  SALIDA_NO_REPORTADA,
  FALLECIMIENTO,
  PROCEDIMIENTO_QUIRURGICO,
  NO_LE_GUSTA,
  DIETA_NO_ADECUADA,
];
