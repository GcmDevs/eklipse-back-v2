import { ORM_ADN_ENTITIES } from '@orm/adn';
import { ORM_GEN_ENTITIES } from '@orm/gen';
import { ORM_HPN_ENTITIES } from '@orm/hpn';
import { ORM_PAC_TRAZ_ENTITIES } from './pacientes/infrastructure/orm/pacientes-trazadores';
import { ESTANCIASPROLONGADAS_ENTITIES } from '@orm/hpn/estancias-prolongadas';
import { ROTULO_MEDICAMENTOS_ENTITIES } from './rotulo-medicamentos/infraestructure/orm/rotulo-medicamentos';
import { FORMATO_MUESTRAS_ANATOMOPATOLOGICAS_ENTITIES } from './formato-anatomopatologicos/infraestructure/orm';
import { SEGUIMIENTO_QUIRURGICO_ENTITIES } from './seguimiento-quirurgico/infraestructure/orm';
import { JustForVerifyOrm } from '@common/infrastructure/services';
import { LGC_TAS_ENTITIES } from '@hpn/lgc/tas/orm';

export const ENTITIES = [
  JustForVerifyOrm,
  ...ORM_ADN_ENTITIES,
  ...ORM_GEN_ENTITIES,
  ...ORM_HPN_ENTITIES,
  ...ORM_PAC_TRAZ_ENTITIES,
  ...ESTANCIASPROLONGADAS_ENTITIES,
  ...ROTULO_MEDICAMENTOS_ENTITIES,
  ...FORMATO_MUESTRAS_ANATOMOPATOLOGICAS_ENTITIES,
  ...SEGUIMIENTO_QUIRURGICO_ENTITIES,
  ...LGC_TAS_ENTITIES,
];
