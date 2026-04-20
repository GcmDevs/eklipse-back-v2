import { DocumentoOrm } from './documento.orm';
import { SuministroPacienteOrm } from './suministros-paciente/suministro-paciente.orm';
import { DetalleSuministroPacienteOrm } from './suministros-paciente/suministro-paciente.detalle.orm';
import { SuministroPacienteRecibidoOrm } from './suministros-paciente/suministro-paciente.recibido.orm';
import { ORM_INN_DOCUMENTOS_SUMPAC_ENTITIES } from './suministros-paciente';

export * from './documento.orm';
export * from './suministros-paciente/suministro-paciente.orm';
export * from './suministros-paciente/suministro-paciente.detalle.orm';
export * from './suministros-paciente/suministro-paciente.recibido.orm';

export const ORM_INN_DOCUMENTOS_ENTITIES = [
  // --- AVOID NOWRAP ---
  DocumentoOrm,
  ...ORM_INN_DOCUMENTOS_SUMPAC_ENTITIES,
];
