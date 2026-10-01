import { AgrupamientoOrm } from './agrupamiento.orm';
import { AlmacenCentroOrm } from './almacen-centro.orm';
import { AlmacenOrm } from './almacen.orm';
import { ExistenciaOrm } from './existencia.orm';
import { FabricanteOrm } from './fabricante.orm';
import { GrupoProductoOrm } from './grupo.orm';
import { LoteProductoOrm } from './lote.orm';

export * from './agrupamiento.orm';
export * from './almacen-centro.orm';
export * from './almacen.orm';
export * from './producto.orm';
export * from './existencia.orm';
export * from './grupo.orm';
export * from './lote.orm';
export * from './fabricante.orm';

export const ORM_PDT_ENTITIES = [
  AgrupamientoOrm,
  AlmacenCentroOrm,
  AlmacenOrm,
  ExistenciaOrm,
  GrupoProductoOrm,
  LoteProductoOrm,
  FabricanteOrm,
];
