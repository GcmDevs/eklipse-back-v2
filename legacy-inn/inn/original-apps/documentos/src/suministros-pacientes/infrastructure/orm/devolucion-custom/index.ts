import { CustomDevolucionDetalleOrm } from './detalle-devolucion.orm';
import { CustomDevolucionOrm } from './devolucion.orm';

export * from './detalle-devolucion.orm';
export * from './devolucion.orm';

export const ORM_INN_DOCS_SUMPAC_DEV_CTM_ENTITIES = [
  CustomDevolucionOrm,
  CustomDevolucionDetalleOrm,
];
