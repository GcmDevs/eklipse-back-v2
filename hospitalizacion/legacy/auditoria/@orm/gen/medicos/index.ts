import { EspecialidadOrm } from './especialidad.orm';
import { MedicoOrm } from './medico.orm';

export * from './especialidad.orm';
export * from './medico.orm';

export const LGC_AUD_GEN_MEDICOS_ENTITIES = [EspecialidadOrm, MedicoOrm];
