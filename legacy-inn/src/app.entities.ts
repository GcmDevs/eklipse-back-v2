import { JustForVerifyOrm } from '@common/infrastructure/services/unnamed.orm';
import { ORM_ADN_ENTITIES } from '@orm/adn';
import { ORM_GEN_ENTITIES } from '@orm/gen';
import { ORM_INN_ENTITIES } from '@orm/inn';
import { ORM_SHARED_ENTITIES } from '@orm/shared-bd';
import { INN_APP_ENTITIES } from 'inn/entities';
import { ORM_INN_CBS_ENTITIES } from './material-osteosintesis/infrastructure/orm';

export const ENTITIES = [
  //
  ...INN_APP_ENTITIES,
  JustForVerifyOrm,
  ...ORM_SHARED_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_INN_ENTITIES,
  ...ORM_ADN_ENTITIES,
  ...ORM_INN_CBS_ENTITIES,
];
