import { LGC_AUD_GEN_MEDICOS_ENTITIES } from './medicos';
import { LGC_AUD_GEN_PACIENTE_ENTITIES } from './pacientes';
import { LGC_AUD_GEN_SEGURIDAD_ENTITIES } from './seguridad';
import { LGC_AUD_GEN_TERCERO_ENTITIES } from './terceros';
import { LGC_AUD_GEN_UBICACION_ENTITIES } from './ubicacion';

export * from './medicos';
export * from './pacientes';
export * from './seguridad';
export * from './terceros';
export * from './ubicacion';

export const LGC_AUD_GEN_ENTITIES = [
  ...LGC_AUD_GEN_MEDICOS_ENTITIES,
  ...LGC_AUD_GEN_PACIENTE_ENTITIES,
  ...LGC_AUD_GEN_SEGURIDAD_ENTITIES,
  ...LGC_AUD_GEN_TERCERO_ENTITIES,
  ...LGC_AUD_GEN_UBICACION_ENTITIES,
];
