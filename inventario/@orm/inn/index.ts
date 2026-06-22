import { ORM_INN_DOCUMENTOS_ENTITIES } from './documentos';
import { ORM_INN_MAOS_ENTITIES } from './maos';
import { ORM_INN_PRODUCTOS_ENTITIES } from './productos';
import { ORM_INN_CTMZ_ENTITIES } from './central-mezclas';
import { ORM_INN_POLLA_MUNDIALISTA_ENTITIES } from './polla-mundialista';

export * from './polla-mundialista';

export const ORM_INN_ENTITIES = [
  ...ORM_INN_PRODUCTOS_ENTITIES,
  ...ORM_INN_DOCUMENTOS_ENTITIES,
  ...ORM_INN_MAOS_ENTITIES,
  ...ORM_INN_CTMZ_ENTITIES,
  ...ORM_INN_POLLA_MUNDIALISTA_ENTITIES,
];
