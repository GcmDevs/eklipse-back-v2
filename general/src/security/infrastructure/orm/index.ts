import { EkCenterOrm } from './ek-center.orm';
import { LastAuthOrm } from './last-auth.orm';
import { PacienteOrm } from './paciente.orm';

export * from './ek-center.orm';
export * from './paciente.orm';
export * from './last-auth.orm';

export const ORM_SECURITY_ENTITIES = [EkCenterOrm, PacienteOrm, LastAuthOrm];
