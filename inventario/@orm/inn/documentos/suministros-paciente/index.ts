import { SuministroPacienteOrm } from './base.orm';
import { DetalleSuministroPacienteOrm } from './detalle.orm';
import { SuministroPacienteRecibidoOrm } from './recibido.orm';

export * from './base.orm';
export * from './detalle.orm';
export * from './recibido.orm';

export const ORM_INN_DOCUMENTOS_SUMPAC_ENTITIES = [
  SuministroPacienteOrm,
  DetalleSuministroPacienteOrm,
  SuministroPacienteRecibidoOrm,
];
