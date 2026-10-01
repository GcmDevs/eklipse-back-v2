import { AuditoriaOrm, ORM_AUDITORIA_ENTITIES } from './auditoria';
import { ESTANCIASPROLONGADAS_ENTITIES } from './estancia-prolongadas';
import { ROTULO_MEDICAMENTOS_ENTITIES } from './rotulo-medicamentos';

export const ORM_HPN_ENTITIES = [
  ...ORM_AUDITORIA_ENTITIES,
  ...ESTANCIASPROLONGADAS_ENTITIES,
  ...ROTULO_MEDICAMENTOS_ENTITIES,
];
