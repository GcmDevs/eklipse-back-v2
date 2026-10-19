import { JustForVerifyOrm } from '@common/infrastructure/services/unnamed.orm';
import { ORM_COMMON_ADN_ENTITIES } from './@orm/adn';
import { ORM_COMMON_GEN_ENTITIES } from './@orm/gen';
import { ORM_COMMON_HPN_ENTITIES } from './@orm/hpn';
import { ORM_COMMON_HCN_ENTITIES } from './@orm/hcn';
import { ORM_COMMON_INN_ENTITIES } from './@orm/inn';
import { ORM_INN_CICLICO_ENTITIES } from '@inn/ciclico/infrastructure/orm';
import { ORIGINAL_APPS_ENTITIES } from './original-apps/original-entities';
import { OLD_ORM_ENTITIES } from './older-apps/old.entities';
import { ORM_INN_FARMACIA_ENTITIES } from '@inn/farmacia/infrastructure/orm';

export const INN_APP_ENTITIES = [
  JustForVerifyOrm,
  ...ORM_COMMON_ADN_ENTITIES,
  ...ORM_COMMON_GEN_ENTITIES,
  ...ORM_COMMON_HCN_ENTITIES,
  ...ORM_COMMON_HPN_ENTITIES,
  ...ORM_COMMON_INN_ENTITIES,
  ...ORM_INN_CICLICO_ENTITIES,
  ...ORM_INN_FARMACIA_ENTITIES,
  ...ORIGINAL_APPS_ENTITIES,
  ...OLD_ORM_ENTITIES,
];
