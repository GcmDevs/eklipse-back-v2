import { OrdenCompraOrm } from './base.orm';
import { DetalleOrdenActivoOrm } from './detalle-activo.orm';
import { DetalleOrdenCompraOrm } from './detalle.orm';

export * from './base.orm';
export * from './detalle.orm';
export * from './detalle-activo.orm';

export const ORM_INN_DOCUMENTOS_OC_ENTITIES = [
  OrdenCompraOrm,
  DetalleOrdenCompraOrm,
  DetalleOrdenActivoOrm,
];
