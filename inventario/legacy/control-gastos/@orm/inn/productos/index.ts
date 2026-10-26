import { AgrupamientoOrm } from './agrupamiento.orm';
import { AlmacenOrm } from './almacen.orm';
import { LGC_CGT_INN_PRODUCTOS_ESTANTES_ENTITIES } from './estantes';
import { ExistenciaOrm } from './existencia.orm';
import { FabricanteOrm } from './fabricante.orm';
import { GrupoProductoOrm } from './grupo.orm';
import { LoteProductoOrm } from './lote.orm';
import { ProductoOrm } from './producto.orm';

export * from './agrupamiento.orm';
export * from './almacen.orm';
export * from './existencia.orm';
export * from './fabricante.orm';
export * from './grupo.orm';
export * from './lote.orm';
export * from './producto.orm';

export const LGC_CGT_INN_PRODUCTOS_ENTITIES = [
  AgrupamientoOrm,
  AlmacenOrm,
  ...LGC_CGT_INN_PRODUCTOS_ESTANTES_ENTITIES,
  ExistenciaOrm,
  FabricanteOrm,
  GrupoProductoOrm,
  LoteProductoOrm,
  ProductoOrm,
];
