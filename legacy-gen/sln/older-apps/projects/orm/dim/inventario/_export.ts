import { AlmacenOrm } from './almacen.orm';
import { DocumentoOrm } from './documento.orm';
import { DetalleOrdenDespachoOrm, OrdenDespachoOrm } from './orden-despacho';
import { ProductoOrm } from './producto.orm';

export const DM_INVENTARIO_ENTITIES = [
  OrdenDespachoOrm,
  DetalleOrdenDespachoOrm,
  ProductoOrm,
  DocumentoOrm,
  AlmacenOrm,
];
