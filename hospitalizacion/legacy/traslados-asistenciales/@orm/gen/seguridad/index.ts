import { RolOrm } from './rol.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './rol.orm';
export * from './usuario.orm';

export const LGC_TAS_GEN_SEGURIDAD_ENTITIES = [RolOrm, UsuarioOrm];
