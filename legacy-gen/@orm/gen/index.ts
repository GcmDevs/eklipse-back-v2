import { AreaServicioOrm } from './area-servicio.orm';
import { ORM_GEN_CTT_ENTITIES } from './ctt';
import { DependenciaOrm } from './dependencia.orm';
import { PacienteOrm } from './paciente.orm';
import { RolOrm } from './rol.orm';
import { TerceroOrm } from './tercero.orm';
import { UsuarioDependenciaOrm } from './usuario-dependencia.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './tercero.orm';
export * from './area-servicio.orm';
export * from './dependencia.orm';
export * from './usuario-dependencia.orm';
export * from './usuario.orm';
export * from './rol.orm';
export * from './paciente.orm';

export const ORM_GEN_ENTITIES = [
  TerceroOrm,
  PacienteOrm,
  AreaServicioOrm,
  DependenciaOrm,
  RolOrm,
  UsuarioDependenciaOrm,
  UsuarioOrm,
  ...ORM_GEN_CTT_ENTITIES,
];
