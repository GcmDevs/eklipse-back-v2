import { ClasificacionOrm } from './set-clasificacion.orm';
import { OfertaDetalleOrm } from './oferta-detalle.orm';
import { ProveedorOrm } from './proveedor.orm';
import { ProductoOrm } from './producto.orm';
import { LineaOrm } from './set-linea.orm';
import { OfertaOrm } from './oferta.orm';
import { SetOrm } from './set.orm';

export * from './set-clasificacion.orm';
export * from './oferta-detalle.orm';
export * from './proveedor.orm';
export * from './producto.orm';
export * from './set-linea.orm';
export * from './oferta.orm';
export * from './set.orm';

export const ORM_INN_MAOS_ENTITIES = [
  ClasificacionOrm,
  OfertaDetalleOrm,
  ProveedorOrm,
  ProductoOrm,
  LineaOrm,
  OfertaOrm,
  SetOrm,
];
