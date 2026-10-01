import { PacienteOrm } from './paciente.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './paciente.orm';
export * from './usuario.orm';

export const GEN_ENTITIES = [PacienteOrm, UsuarioOrm];
