import { DocumentoOrm } from './documento.orm';
import { ORM_CRN_RDC_ENTITIES } from './rdc';

export * from './documento.orm';

export const ORM_CRN_ENTITIES = [
  //
  DocumentoOrm,
  ...ORM_CRN_RDC_ENTITIES,
];
