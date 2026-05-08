import { CtmType } from '@common/domain/types';

export type MotivoBloqueoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export class MotivoBloqueoType extends CtmType<MotivoBloqueoCode> {}

const NINGUNO = new MotivoBloqueoType(0, 'NINGUNO');
const RESERVA = new MotivoBloqueoType(1, 'RESERVA');
const MANTENIMIENTO = new MotivoBloqueoType(2, 'MANTENIMIENTO');
const DIAGNOSTICA = new MotivoBloqueoType(3, 'DIAGNÓSTICO');
const UNIPERSONAL = new MotivoBloqueoType(4, 'UNIPERSONAL');
const AISLAMIENTO = new MotivoBloqueoType(5, 'AISLAMIENTO');

export function motivoBloqueoTypeFactory(code: MotivoBloqueoCode): MotivoBloqueoType {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return RESERVA;
    case 2:
      return MANTENIMIENTO;
    case 3:
      return DIAGNOSTICA;
    case 4:
      return UNIPERSONAL;
    case 5:
      return AISLAMIENTO;
  }
}

export const MOTIVOS_BLOQUEO_VALUES = [
  NINGUNO,
  RESERVA,
  MANTENIMIENTO,
  DIAGNOSTICA,
  UNIPERSONAL,
  AISLAMIENTO,
];

export const MOTIVOS_BLOQUEO = {
  NINGUNO,
  RESERVA,
  MANTENIMIENTO,
  DIAGNOSTICA,
  UNIPERSONAL,
  AISLAMIENTO,
};
