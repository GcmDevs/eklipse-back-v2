import { DocumentoOrm } from './documento.orm';
import { ORM_INN_DOCUMENTOS_SUMPAC_ENTITIES } from './suministros-paciente';
import { ORM_INN_DOCUMENTOS_OC_ENTITIES } from './orden-compra';

export * from './documento.orm';
export * from './suministros-paciente/base.orm';
export * from './suministros-paciente/detalle.orm';
export * from './suministros-paciente/recibido.orm';

export const ORM_INN_DOCUMENTOS_ENTITIES = [
  DocumentoOrm,
  ...ORM_INN_DOCUMENTOS_SUMPAC_ENTITIES,
  ...ORM_INN_DOCUMENTOS_OC_ENTITIES,
];
