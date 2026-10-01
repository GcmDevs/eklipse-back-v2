import { ORM_GEN_AREA_ENTITIES } from './areas';
import { ORM_GEN_MEDICOS_ENTITIES } from './medicos';
import { ORM_GEN_PACIENTE_ENTITIES } from './pacientes';
import { ORM_GEN_SEGURIDAD_ENTITIES } from './seguridad';
import { ORM_GEN_TERCERO_ENTITIES } from './terceros';
import { ORM_GEN_UBICACION_ENTITIES } from './ubicacion';

export * from './ubicacion';
export * from './terceros';
export * from './seguridad';
export * from './areas';
export * from './pacientes';

export const ORM_GEN_ENTITIES = [
  ...ORM_GEN_AREA_ENTITIES,
  ...ORM_GEN_PACIENTE_ENTITIES,
  ...ORM_GEN_SEGURIDAD_ENTITIES,
  ...ORM_GEN_TERCERO_ENTITIES,
  ...ORM_GEN_UBICACION_ENTITIES,
  ...ORM_GEN_MEDICOS_ENTITIES,
];
