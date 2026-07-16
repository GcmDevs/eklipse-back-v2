import { ORM_ADN_ENTITIES } from '@orm/adn';
import { ORM_GEN_ENTITIES } from '@orm/gen';
import { ORM_HPN_ENTITIES } from '@orm/hpn';
import { ORM_PAC_TRAZ_ENTITIES } from './pacientes/infrastructure/orm/pacientes-trazadores';
import { ESTANCIASPROLONGADAS_ENTITIES } from '@orm/hpn/estancias-prolongadas';
import { ROTULO_MEDICAMENTOS_ENTITIES } from './rotulo-medicamentos/infraestructure/orm/rotulo-medicamentos';

export const ENTITIES = [
  ...ORM_ADN_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_HPN_ENTITIES,
  ...ORM_PAC_TRAZ_ENTITIES,
  ...ESTANCIASPROLONGADAS_ENTITIES,
  ...ROTULO_MEDICAMENTOS_ENTITIES,
];
