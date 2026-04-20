import { ORM_ADN_ENTITIES } from '@inn/orm/adn';
import { ORM_GEN_ENTITIES } from '@inn/orm/gen';
import { ORM_HPN_ENTITIES } from '@inn/orm/hpn';
import { ORM_INN_ENTITIES } from '@inn/orm/inn';
import { ORM_SHARED_ENTITIES } from '@inn/orm/shared-bd';

export const ENTITIES = [
  // --- AVOID NOWRAP --- //
  ...ORM_ADN_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_HPN_ENTITIES,
  ...ORM_INN_ENTITIES,
  ...ORM_SHARED_ENTITIES,
];
