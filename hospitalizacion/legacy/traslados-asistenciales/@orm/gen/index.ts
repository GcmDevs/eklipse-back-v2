import { LGC_TAS_GEN_PACIENTE_ENTITIES } from './pacientes';
import { LGC_TAS_GEN_SEGURIDAD_ENTITIES } from './seguridad';
import { LGC_TAS_GEN_TERCERO_ENTITIES } from './terceros';
import { LGC_TAS_GEN_UBICACION_ENTITIES } from './ubicacion';

export * from './pacientes';
export * from './seguridad';
export * from './terceros';
export * from './ubicacion';

export const LGC_TAS_GEN_ENTITIES = [
  ...LGC_TAS_GEN_PACIENTE_ENTITIES,
  ...LGC_TAS_GEN_SEGURIDAD_ENTITIES,
  ...LGC_TAS_GEN_TERCERO_ENTITIES,
  ...LGC_TAS_GEN_UBICACION_ENTITIES,
];
