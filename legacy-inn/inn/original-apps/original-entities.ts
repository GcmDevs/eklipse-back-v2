import { ORM_ACTIVOS_ENTITIES } from './activos/src/activos.entities';
import { ORM_INN_CTCPFB_ENTITIES } from './cotizaciones-prefabricadas/infrastructure/orm';
import { ORM_SUMINISTROS_ENTITIES } from './documentos/src/documentos.entities';
import { ORM_PRODUCTOS_ENTITIES } from './productos/src/productos.entities';

/** @deprecated */
export const ORIGINAL_APPS_ENTITIES = [
  ...ORM_PRODUCTOS_ENTITIES,
  ...ORM_SUMINISTROS_ENTITIES,
  ...ORM_ACTIVOS_ENTITIES,
  ...ORM_INN_CTCPFB_ENTITIES,
];
