import { SuministroPacienteOrm } from './suministro-paciente.orm';
import { DetalleSuministroPacienteOrm } from './suministro-paciente.detalle.orm';
import { SuministroPacienteRecibidoOrm } from './suministro-paciente.recibido.orm';

export * from './suministro-paciente.orm';
export * from './suministro-paciente.detalle.orm';
export * from './suministro-paciente.recibido.orm';

export const ORM_INN_DOCUMENTOS_SUMPAC_ENTITIES = [
  SuministroPacienteOrm,
  DetalleSuministroPacienteOrm,
  SuministroPacienteRecibidoOrm,
];
