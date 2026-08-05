import { GrupoOrm } from './grupo.orm';
import { ProductoOrm } from './producto.orm';

export * from './grupo.orm';
export * from './producto.orm';

export const ORM_AFN_ENTITIES = [
  // -- AVOID NOWRAP -- //
  GrupoOrm,
  ProductoOrm,
];
