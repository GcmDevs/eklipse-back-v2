import { AreaServicioOrm } from './area-servicio.orm';
import { ConsecutivoOrm } from './consecutivo.orm';
import { DependenciaOrm } from './dependencia.orm';
import { PacienteOrm } from './paciente.orm';
import { ProveedorOrm } from './proveedor.orm';
import { RolOrm } from './rol.orm';
import { TerceroOrm } from './tercero.orm';
import { UsuarioDependenciaOrm } from './usuario-dependencia.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './area-servicio.orm';
export * from './dependencia.orm';
export * from './paciente.orm';
export * from './usuario-dependencia.orm';
export * from './usuario.orm';
export * from './tercero.orm';
export * from './proveedor.orm';
export * from './rol.orm';
export * from './consecutivo.orm';

export const ORM_COMMON_GEN_ENTITIES = [
  AreaServicioOrm,
  UsuarioOrm,
  PacienteOrm,
  DependenciaOrm,
  UsuarioDependenciaOrm,
  ProveedorOrm,
  TerceroOrm,
  RolOrm,
  ConsecutivoOrm,
];
