import { ORM_INN_PRODUCTOS_ENTITIES, ProductoOrm } from './productos';
import { ORM_INN_DOCUMENTOS_ENTITIES } from './documentos';
import { ORM_INN_MAOS_ENTITIES } from './maos';
import { ORM_INN_CTMZ_ENTITIES } from './central-mezclas';
import { ORM_INN_POLLA_MUNDIALISTA_ENTITIES } from './polla-mundialista';
import { ORM_CTC_ENTITIES } from './central-compras';
import { ORM_AFN_ENTITIES } from './activos-fijos';

export * from './polla-mundialista';

export const ORM_INN_ENTITIES = [
  ProductoOrm,
  ...ORM_INN_PRODUCTOS_ENTITIES,
  ...ORM_INN_DOCUMENTOS_ENTITIES,
  ...ORM_INN_MAOS_ENTITIES,
  ...ORM_INN_CTMZ_ENTITIES,
  ...ORM_INN_POLLA_MUNDIALISTA_ENTITIES,
  ...ORM_CTC_ENTITIES,
  ...ORM_AFN_ENTITIES,
];
