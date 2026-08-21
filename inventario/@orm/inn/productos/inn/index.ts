import { AgrupamientoOrm } from './agrupamiento.orm';
import { ExistenciaOrm } from './existencia.orm';
import { FabricanteOrm } from './fabricante.orm';
import { GrupoProductoOrm } from './grupo.orm';
import { LoteProductoOrm } from './lote.orm';
import { ProductoOrm } from './producto.orm';

export * from './agrupamiento.orm';
export * from './producto.orm';
export * from './existencia.orm';
export * from './grupo.orm';
export * from './lote.orm';
export * from './fabricante.orm';

export const ORM_INN_PRODUCTS_ENTITIES = [
  ProductoOrm,
  AgrupamientoOrm,
  ExistenciaOrm,
  GrupoProductoOrm,
  LoteProductoOrm,
  FabricanteOrm,
];
