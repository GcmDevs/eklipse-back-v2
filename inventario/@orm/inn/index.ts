import { ORM_INN_PRODUCTOS_ENTITIES, ProductoOrm } from './productos';
import { ORM_INN_DOCUMENTOS_ENTITIES } from './documentos';
import { ORM_INN_MAOS_ENTITIES } from './maos';
import { ORM_INN_CTMZ_ENTITIES } from './central-mezclas';
import { ORM_AFN_ENTITIES } from './activos-fijos';
import { ORM_INN_SOLICITUD_PEDIDO_ENTITIES } from './solicitud-pedido';
import { ORM_INN_PRODUCTS_ENTITIES } from './productos/inn';

export const ORM_INN_ENTITIES = [
  ProductoOrm,
  ...ORM_INN_PRODUCTOS_ENTITIES,
  ...ORM_INN_DOCUMENTOS_ENTITIES,
  ...ORM_INN_MAOS_ENTITIES,
  ...ORM_INN_CTMZ_ENTITIES,
  ...ORM_AFN_ENTITIES,
  ...ORM_INN_SOLICITUD_PEDIDO_ENTITIES,
  ...ORM_INN_PRODUCTS_ENTITIES,
];
