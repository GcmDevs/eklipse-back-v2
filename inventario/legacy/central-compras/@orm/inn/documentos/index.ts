import { DocumentoOrm } from './documento.orm';
import { OrdenCompraOrm } from './orden-compra.orm';
import { DetalleOrdenCompraOrm } from './orden-compra.detalle.orm';
import { DetalleOrdenActivoOrm } from './orden-compra.detalle-activo.orm';

export * from './documento.orm';
export * from './orden-compra.orm';
export * from './orden-compra.detalle.orm';
export * from './orden-compra.detalle-activo.orm';

export const ORM_DCM_ENTITIES = [
  DetalleOrdenActivoOrm,
  DetalleOrdenCompraOrm,
  OrdenCompraOrm,
  DocumentoOrm,
];
