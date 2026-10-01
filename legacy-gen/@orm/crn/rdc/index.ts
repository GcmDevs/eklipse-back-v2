import { DetalleOrm } from './detalle.orm';
import { RadicacionOrm } from './radicacion.orm';
import { SoporteOrm } from './soporte.orm';

export * from './detalle.orm';
export * from './radicacion.orm';
export * from './soporte.orm';

export const ORM_CRN_RDC_ENTITIES = [
  //
  DetalleOrm,
  RadicacionOrm,
  SoporteOrm,
];
