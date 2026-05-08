import { ORM_ADN_ENTITIES } from '@orm/adn';
import { ORM_GEN_ENTITIES } from '@orm/gen';
import { ORM_HPN_ENTITIES } from '@orm/hpn';
import { ORM_PAC_TRAZ_ENTITIES } from './pacientes/infrastructure/orm/pacientes-trazadores';

export const ENTITIES = [
  // --- AVOID NOWRAP --- //
  ...ORM_ADN_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_HPN_ENTITIES,
  ...ORM_PAC_TRAZ_ENTITIES,
];
