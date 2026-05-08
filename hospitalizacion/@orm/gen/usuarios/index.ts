import { RolOrm } from './rol.orm';
import { UsuarioDependenciaOrm } from './usuario-dependencia.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './rol.orm';
export * from './usuario-dependencia.orm';
export * from './usuario.orm';

export const ORM_GEN_USUARIOS_ENTITIES = [
  // --- AVOID NOWRAP --- //
  RolOrm,
  UsuarioDependenciaOrm,
  UsuarioOrm,
];
