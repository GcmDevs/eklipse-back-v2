import { ORM_OLD_IMPORTS_ENTITIES } from 'hpn/older-apps/old-imports.entities';
import { ORM_ORI_IMPORTS_ENTITIES } from 'hpn/original-apps/ori-imports.entities';

export const HPN_APP_ENTITIES = [
  //
  ...ORM_ORI_IMPORTS_ENTITIES,
  ...ORM_OLD_IMPORTS_ENTITIES,
];
