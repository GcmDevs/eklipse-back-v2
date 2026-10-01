import { EKLIPSE_SHARED_ORM } from '@sln/old/ekl/orm/export';
import { DM_GENERAL_ENTITIES } from '@sln/old/orm/dim/general/_export';
import { DM_HOSPITALIZACION_ENTITIES } from '@sln/old/orm/dim/hospitalizacion/_export';
import { DM_INVENTARIO_ENTITIES } from '@sln/old/orm/dim/inventario/_export';
import { GCM_HOSPITALIZACION_ENTITIES } from '@sln/old/orm/gcm/hospitalizacion/_export';
import { GCM_INVENTARIO_ENTITIES } from '@sln/old/orm/gcm/inventario/_export';
import { ORM_COMMON_ENTITIES } from '@sln/old/common/infrastructure/orm/_export';
import { OLD_ENTITIES } from '@sln/rft/@old/old.entities';
import { ORM_CONFIG_ENTITIES } from './config/orm';
import { RADICACION_FACTURACION_ENTITIES_ORM } from './radicacion-de-facturacion/infrastructure/orm';
import { GcvRadFac } from './radicacion-de-facturacion/entity';

export const OLD_ORM_ENTITIES = [
  ...OLD_ENTITIES,
  ...GCM_INVENTARIO_ENTITIES,
  ...GCM_HOSPITALIZACION_ENTITIES,
  ...DM_GENERAL_ENTITIES,
  ...DM_HOSPITALIZACION_ENTITIES,
  ...DM_INVENTARIO_ENTITIES,
  ...EKLIPSE_SHARED_ORM,
  ...ORM_COMMON_ENTITIES,
  ...ORM_CONFIG_ENTITIES,
  GcvRadFac,
  ...RADICACION_FACTURACION_ENTITIES_ORM,
];
