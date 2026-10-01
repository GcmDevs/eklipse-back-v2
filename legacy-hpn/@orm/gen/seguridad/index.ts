import { ConsecutivoOrm } from './consecutivo.orm';
import { RolOrm } from './rol.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './consecutivo.orm';
export * from './rol.orm';
export * from './usuario.orm';

export const ORM_GEN_SEGURIDAD_ENTITIES = [ConsecutivoOrm, RolOrm, UsuarioOrm];
