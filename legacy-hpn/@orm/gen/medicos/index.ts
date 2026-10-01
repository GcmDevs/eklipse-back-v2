import { EspecialidadOrm } from './especialidad.orm';
import { MedicoOrm } from './medico.orm';

export * from './especialidad.orm';
export * from './medico.orm';

export const ORM_GEN_MEDICOS_ENTITIES = [MedicoOrm, EspecialidadOrm];
