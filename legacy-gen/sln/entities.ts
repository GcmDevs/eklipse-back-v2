import { ADN_ENTITIES } from './@orm/adn';
import { GEN_ENTITIES } from './@orm/gen';
import { HPN_ENTITIES } from './@orm/hpn';
import { SLN_ORM_ENTITIES } from './@orm/sln';
import { ORM_INFO_GEREN_ENTITIES } from '@sln/pfgp/infrastructure/orm';
import { OLD_ORM_ENTITIES } from './older-apps/old.entities';

export const SLN_APP_ENTITIES = [
  //
  ...ADN_ENTITIES,
  ...GEN_ENTITIES,
  ...HPN_ENTITIES,
  ...SLN_ORM_ENTITIES,
  ...OLD_ORM_ENTITIES,
  ...ORM_INFO_GEREN_ENTITIES,
];
