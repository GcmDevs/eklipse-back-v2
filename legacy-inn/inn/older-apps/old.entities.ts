import { ORM_CONFIG_ENTITIES } from './config/orm';
import { INVENTARIO_ENTITIES_OLDE } from '@inn/old/inn/orm/export';
import { ORM_INN_RECTEC_ENTITIES } from '@inn/old/inn/recepcion-tecnica/orm/_export';
import { ORM_COMMON_ENTITIES } from './common/infrastructure/orm/_export';
import { DM_INVENTARIO_ENTITIES } from '@inn/old/orm/dim/inventario/_export';
import { DM_HOSPITALIZACION_ENTITIES } from '@inn/old/orm/dim/hospitalizacion/_export';
import { DM_GENERAL_ENTITIES } from '@inn/old/orm/dim/general/_export';

/** @deprecated */
export const OLD_ORM_ENTITIES = [
  ...ORM_COMMON_ENTITIES,
  ...ORM_CONFIG_ENTITIES,
  ...INVENTARIO_ENTITIES_OLDE,
  ...ORM_INN_RECTEC_ENTITIES,
  ...DM_INVENTARIO_ENTITIES,
  ...DM_HOSPITALIZACION_ENTITIES,
  ...DM_GENERAL_ENTITIES,
];
