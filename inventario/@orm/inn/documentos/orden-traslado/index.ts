import { OrdenTrasladoOrm } from './base.orm';
import { DetalleOrdenTrasladoOrm } from './detalle.orm';

export * from './base.orm';
export * from './detalle.orm';

export const ORM_INN_DOCUMENTOS_ORDTRAS_ENTITIES = [OrdenTrasladoOrm, DetalleOrdenTrasladoOrm];
