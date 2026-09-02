import { CtmType } from '@common/domain/types';

export type EstadoCamaCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const NINGUNO = new CtmType<EstadoCamaCode>(0, 'NINGUNO');
const DESOCUPADA = new CtmType<EstadoCamaCode>(1, 'DESOCUPADA');
const OCUPADA = new CtmType<EstadoCamaCode>(2, 'OCUPADA');
const BLOQUEADA = new CtmType<EstadoCamaCode>(3, 'BLOQUEADA');
const DESBLOQUEADA = new CtmType<EstadoCamaCode>(4, 'DESBLOQUEADA');
const MANTENIMIENTO = new CtmType<EstadoCamaCode>(5, 'MANTENIMIENTO');
const INACTIVA = new CtmType<EstadoCamaCode>(6, 'INACTIVA');

export function estadoCamaTypeFactory(code: EstadoCamaCode): CtmType<EstadoCamaCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return DESOCUPADA;
    case 2:
      return OCUPADA;
    case 3:
      return BLOQUEADA;
    case 4:
      return DESBLOQUEADA;
    case 5:
      return MANTENIMIENTO;
    case 6:
      return INACTIVA;
  }
}

export const ESTADOS_CAMA_VALUES = [
  NINGUNO,
  DESOCUPADA,
  OCUPADA,
  BLOQUEADA,
  DESBLOQUEADA,
  MANTENIMIENTO,
  INACTIVA,
];

export const ESTADOS_CAMA = {
  NINGUNO,
  DESOCUPADA,
  OCUPADA,
  BLOQUEADA,
  DESBLOQUEADA,
  MANTENIMIENTO,
  INACTIVA,
};
