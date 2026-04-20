import { UsuarioDependenciaOrm } from './usuario-dependencia.orm';
import { AreaServicioOrm } from './area-servicio.orm';
import { ConsecutivoOrm } from './consecutivo.orm';
import { DependenciaOrm } from './dependencia.orm';
import { ProveedorOrm } from './proveedor.orm';
import { PacienteOrm } from './paciente.orm';
import { ContratoOrm } from './contrato.orm';
import { TerceroOrm } from './tercero.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './usuario-dependencia.orm';
export * from './area-servicio.orm';
export * from './dependencia.orm';
export * from './consecutivo.orm';
export * from './proveedor.orm';
export * from './paciente.orm';
export * from './contrato.orm';
export * from './tercero.orm';
export * from './usuario.orm';

export const ORM_GEN_ENTITIES = [
  UsuarioDependenciaOrm,
  AreaServicioOrm,
  ConsecutivoOrm,
  DependenciaOrm,
  ProveedorOrm,
  PacienteOrm,
  TerceroOrm,
  UsuarioOrm,
  ContratoOrm,
];
