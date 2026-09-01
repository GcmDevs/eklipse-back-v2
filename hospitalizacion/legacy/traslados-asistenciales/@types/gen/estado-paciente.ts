import { CtmType } from '@common/domain/types';

export type EstadoPacienteCode = 0 | 1 | 2 | 3;

const NINGUNO = new CtmType<EstadoPacienteCode>(0, 'NINGUNO');
const ACTIVO = new CtmType<EstadoPacienteCode>(1, 'ACTIVO');
const INACTIVO = new CtmType<EstadoPacienteCode>(2, 'INACTIVO');
const SUSPENDIDO = new CtmType<EstadoPacienteCode>(3, 'SUSPENDIDO');

export function estadoPacienteTypeFactory(code: EstadoPacienteCode): CtmType<EstadoPacienteCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return ACTIVO;
    case 2:
      return INACTIVO;
    case 3:
      return SUSPENDIDO;
  }
}

export const ESTADOS_PACIENTE_VALUES = [NINGUNO, ACTIVO, INACTIVO, SUSPENDIDO];

export const ESTADOS_PACIENTE = { NINGUNO, ACTIVO, INACTIVO, SUSPENDIDO };
