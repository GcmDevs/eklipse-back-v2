import { ORM_INN_DOCUMENTOS_ENTITIES } from './documentos';
import { ORM_INN_MAOS_ENTITIES } from './maos';
import { ORM_INN_PRODUCTOS_ENTITIES } from './productos';

export const ORM_INN_ENTITIES = [
  // --- AVOID NOWRAP --- //
  ...ORM_INN_PRODUCTOS_ENTITIES,
  ...ORM_INN_DOCUMENTOS_ENTITIES,
  ...ORM_INN_MAOS_ENTITIES,
];
