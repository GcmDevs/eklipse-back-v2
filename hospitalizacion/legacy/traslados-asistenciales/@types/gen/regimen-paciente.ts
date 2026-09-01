import { CtmType } from '@common/domain/types';

export type RegimenPacienteCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const NINGUNO = new CtmType<RegimenPacienteCode>(0, 'NINGUNO');
const CONTRIBUTIVO = new CtmType<RegimenPacienteCode>(1, 'CONTRIBUTIVO');
const SUBSIDIADO = new CtmType<RegimenPacienteCode>(2, 'SUBSIDIADO');
const VINCULADO = new CtmType<RegimenPacienteCode>(3, 'VINCULADO');
const PARTICULAR = new CtmType<RegimenPacienteCode>(4, 'PARTICULAR');
const OTRO = new CtmType<RegimenPacienteCode>(5, 'OTRO');
const DESPL_REG_CONTR = new CtmType<RegimenPacienteCode>(6, 'DESPL REG CONTR');
const DESPL_REG_SUBS = new CtmType<RegimenPacienteCode>(7, 'DESPL REG SUBS');
const DESPL_NO_ASEGU = new CtmType<RegimenPacienteCode>(8, 'DESPL NO ASEGU');

export function regimenPacienteTypeFactory(
  code: RegimenPacienteCode
): CtmType<RegimenPacienteCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return CONTRIBUTIVO;
    case 2:
      return SUBSIDIADO;
    case 3:
      return VINCULADO;
    case 4:
      return PARTICULAR;
    case 5:
      return OTRO;
    case 6:
      return DESPL_REG_CONTR;
    case 7:
      return DESPL_REG_SUBS;
    case 8:
      return DESPL_NO_ASEGU;
  }
}

export const REGIMENES_PACIENTE_VALUES = [
  NINGUNO,
  CONTRIBUTIVO,
  SUBSIDIADO,
  VINCULADO,
  PARTICULAR,
  OTRO,
  DESPL_REG_CONTR,
  DESPL_REG_SUBS,
  DESPL_NO_ASEGU,
];

export const REGIMENES_PACIENTE = {
  NINGUNO,
  CONTRIBUTIVO,
  SUBSIDIADO,
  VINCULADO,
  PARTICULAR,
  OTRO,
  DESPL_REG_CONTR,
  DESPL_REG_SUBS,
  DESPL_NO_ASEGU,
};
