import { ORM_ADN_ENTITIES } from './adn';
import { ORM_GEN_ENTITIES } from './gen';
import { ORM_INN_ENTITIES } from './inn';
import { ORM_SHARED_ENTITIES } from './shared-bd';

export const LGC_CTC_ENTITIES = [
  ...ORM_ADN_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_INN_ENTITIES,
  ...ORM_SHARED_ENTITIES,
];
