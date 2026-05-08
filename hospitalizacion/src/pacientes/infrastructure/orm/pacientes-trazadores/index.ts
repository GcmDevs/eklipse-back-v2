import { PacTrazEncuestaOrm } from './encuesta.orm';
import { PacTrazPreguntaOrm } from './pregunta.orm';
import { PacTrazRespuestaOrm } from './respuesta.orm';
import { PacientePreAltaOrm } from './paciente-pre-alta.orm';

export * from './encuesta.orm';
export * from './pregunta.orm';
export * from './respuesta.orm';
export * from './paciente-pre-alta.orm';

export const ORM_PAC_TRAZ_ENTITIES = [
  // --- AVOID NOWRAP --- //
  PacTrazEncuestaOrm,
  PacTrazPreguntaOrm,
  PacTrazRespuestaOrm,
  PacientePreAltaOrm,
];
