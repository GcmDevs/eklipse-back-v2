import { CtmType } from '@common/domain/types';

export type PacTrazCategoriaPreguntaCode = 1 | 2 | 3 | 4 | 5;

export class PacTrazCategoriaPreguntaType extends CtmType<PacTrazCategoriaPreguntaCode> {}

const INFO_PACIENTE = new PacTrazCategoriaPreguntaType(
  1,
  'INFORMACIÓN AL PACIENTE Y SU FAMILIA Y SU PARTICIPACION ACTIVA EN EL CUIDADO'
);
const OPORT_PERTINE = new PacTrazCategoriaPreguntaType(
  2,
  'CUIDADO BASADO EN VALOR: OPORTUNIDAD Y PERTINENCIA'
);
const CUIDA_CONFIAB = new PacTrazCategoriaPreguntaType(
  3,
  'CUIDADO CONFIABLE: SEGURIDAD DEL PACIENTE'
);
const HUMA_EXP_POSI = new PacTrazCategoriaPreguntaType(4, 'HUMANIZACIÓN: EXPERIENCIA POSITIVA');
const GESTI_CONOCIM = new PacTrazCategoriaPreguntaType(
  5,
  'GESTIÓN DEL CONOCIMIENTO: CALIDAD EN LOS REGISTROS CLINICOS'
);

export function pacTrazCategoriaPreguntaTypeFactory(
  code: PacTrazCategoriaPreguntaCode
): PacTrazCategoriaPreguntaType {
  switch (code) {
    case 1:
      return INFO_PACIENTE;
    case 2:
      return OPORT_PERTINE;
    case 3:
      return CUIDA_CONFIAB;
    case 4:
      return HUMA_EXP_POSI;
    case 5:
      return GESTI_CONOCIM;
  }
}

export const PAC_TRAZ_CATEGORIAS_PREGUNTA = {
  INFO_PACIENTE,
  OPORT_PERTINE,
  CUIDA_CONFIAB,
  HUMA_EXP_POSI,
  GESTI_CONOCIM,
};

export const PAC_TRAZ_CATEGORIAS_PREGUNTA_VALUES = [
  INFO_PACIENTE,
  OPORT_PERTINE,
  CUIDA_CONFIAB,
  HUMA_EXP_POSI,
  GESTI_CONOCIM,
];
