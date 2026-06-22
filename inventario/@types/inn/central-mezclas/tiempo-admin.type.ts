import { CtmType } from '@common/domain/types';

export type TiempoAdminCode = 1 | 2;

export class TiempoAdminType extends CtmType<TiempoAdminCode> {}

const MINUTOS = new TiempoAdminType(1, 'MINUTOS');
const HORAS = new TiempoAdminType(2, 'HORAS');

export function tiempoAdminTypeFactory(code: TiempoAdminCode): TiempoAdminType {
  switch (code) {
    case 1:
      return MINUTOS;
    case 2:
      return HORAS;
  }
}

export const TIEMPOS_ADMIN_VALUES = [MINUTOS, HORAS];

export const TIEMPOS_ADMIN = { MINUTOS, HORAS };
