import { MedicamentoSeleccionOrm } from './medicamento-seleccion.orm';
import { PacienteExternoOrm } from './paciente-externo.orm';
import { MedicamentoOrm } from './medicamento.orm';
import { SolicitudOrm } from './solicitud.orm';

export * from './medicamento-seleccion.orm';
export * from './paciente-externo.orm';
export * from './medicamento.orm';
export * from './solicitud.orm';

export const ORM_INN_CTMZ_ENTITIES = [
  // --- AVOID NOWRAP --- //
  MedicamentoOrm,
  MedicamentoSeleccionOrm,
  PacienteExternoOrm,
  SolicitudOrm,
];
