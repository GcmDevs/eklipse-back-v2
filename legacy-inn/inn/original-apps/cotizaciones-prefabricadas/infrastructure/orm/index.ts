import { ValorItemCotizadoOrm } from './valor-item-cotizado.orm';
import { ItemCotizadoOrm } from './item-cotizado.orm';
import { ProductoSetOrm } from './producto-set.orm';
import { SetOrm } from './set.orm';

export * from './valor-item-cotizado.orm';
export * from './item-cotizado.orm';
export * from './set.orm';
export * from './producto-set.orm';

export const ORM_INN_CTCPFB_ENTITIES = [
  ProductoSetOrm,
  ItemCotizadoOrm,
  ValorItemCotizadoOrm,
  SetOrm,
];
