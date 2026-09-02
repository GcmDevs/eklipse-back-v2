import { CtmType } from '@common/domain/types';

export type MotivoBloqueoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const NINGUNO = new CtmType<MotivoBloqueoCode>(0, 'NINGUNO');
const RESERVA = new CtmType<MotivoBloqueoCode>(1, 'RESERVA');
const MANTENIMIENTO = new CtmType<MotivoBloqueoCode>(2, 'MANTENIMIENTO');
const DIAGNOSTICA = new CtmType<MotivoBloqueoCode>(3, 'DIAGNÓSTICO');
const UNIPERSONAL = new CtmType<MotivoBloqueoCode>(4, 'UNIPERSONAL');
const AISLAMIENTO = new CtmType<MotivoBloqueoCode>(5, 'AISLAMIENTO');

export function motivoBloqueoTypeFactory(code: MotivoBloqueoCode): CtmType<MotivoBloqueoCode> {
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
