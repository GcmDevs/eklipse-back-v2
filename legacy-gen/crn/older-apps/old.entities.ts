import { DM_GENERAL_ENTITIES } from '@crn/old/orm/dim/general/_export';
import { DM_HOSPITALIZACION_ENTITIES } from '@crn/old/orm/dim/hospitalizacion/_export';
import { DM_INVENTARIO_ENTITIES } from '@crn/old/orm/dim/inventario/_export';
import { GCM_HOSPITALIZACION_ENTITIES } from '@crn/old/orm/gcm/hospitalizacion/_export';
import { GCM_INVENTARIO_ENTITIES } from '@crn/old/orm/gcm/inventario/_export';
import { ORM_COMMON_ENTITIES } from '@crn/old/common/infrastructure/orm/_export';
import { OLD_ENTITIES } from '@crn/rft/@old/old.entities';

export const OLD_ORM_ENTITIES = [
  ...OLD_ENTITIES,
  ...GCM_INVENTARIO_ENTITIES,
  ...GCM_HOSPITALIZACION_ENTITIES,
  ...DM_GENERAL_ENTITIES,
  ...DM_HOSPITALIZACION_ENTITIES,
  ...DM_INVENTARIO_ENTITIES,
  ...ORM_COMMON_ENTITIES,
];
