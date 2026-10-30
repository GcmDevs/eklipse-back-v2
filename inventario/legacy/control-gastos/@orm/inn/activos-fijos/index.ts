import { GrupoOrm } from './grupo.orm';
import { ProductoOrm } from './producto.orm';

export * from './grupo.orm';
export * from './producto.orm';

export const LGC_CGT_INN_ACTIVOS_FIJOS_ENTITIES = [GrupoOrm, ProductoOrm];
