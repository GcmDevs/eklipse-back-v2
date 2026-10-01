import { JustForVerifyOrm } from '@common/infrastructure/services/unnamed.orm';
import { ORM_ADN_ENTITIES } from '@orm/adn';
import { ORM_GEN_GESTION_CLINICA_ENTITIES } from '@orm/gcn';
import { ORM_GEN_ENTITIES } from '@orm/gen';
import { ORM_HCN_ENTITIES } from '@orm/hcn';
import { ORM_HPN_ENTITIES } from '@orm/hpn';
import { ORM_TEMP_ENTITIES } from '@orm/temp';
import { HPN_APP_ENTITIES } from 'hpn/entities';

export const ENTITIES = [
  ...HPN_APP_ENTITIES,
  JustForVerifyOrm,
  ...ORM_ADN_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_TEMP_ENTITIES,
  ...ORM_HCN_ENTITIES,
  ...ORM_GEN_GESTION_CLINICA_ENTITIES,
  ...ORM_HPN_ENTITIES,
];
