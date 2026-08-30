import { InformacionAdicionalOrm } from './informacion-adicional.orm';
import { ActivoOrm } from './activo.orm';
import { GrupoOrm } from './grupo.orm';
import { ProductoOrm } from './producto.orm';

export * from './informacion-adicional.orm';
export * from './activo.orm';
export * from './grupo.orm';
export * from './producto.orm';

export const ORM_AFN_ENTITIES = [InformacionAdicionalOrm, ActivoOrm, GrupoOrm, ProductoOrm];
