import { JustForVerifyOrm } from '@common/infrastructure/services/unnamed.orm';
import { ORM_SECURITY_ENTITIES } from '@gen/security/infrastructure/orm';
import { ORM_ADN_ENTITIES } from '@orm/adn';
import { ORM_CRN_ENTITIES } from '@orm/crn';
import { ORM_GEN_ENTITIES } from '@orm/gen';
import { ORM_SLN_ENTITIES } from '@orm/sln';
import { CRN_APP_ENTITIES } from 'crn/entities';
import { HCN_APP_ENTITIES } from 'hcn/entities';
import { SLN_APP_ENTITIES } from 'sln/entities';

export const ENTITIES = [
  //
  JustForVerifyOrm,
  ...HCN_APP_ENTITIES,
  ...ORM_SECURITY_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_CRN_ENTITIES,
  ...ORM_ADN_ENTITIES,
  ...ORM_SLN_ENTITIES,
  ...CRN_APP_ENTITIES,
  ...SLN_APP_ENTITIES,
];
