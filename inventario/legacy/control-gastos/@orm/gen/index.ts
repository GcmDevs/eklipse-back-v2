import { AreaServicioOrm } from './area-servicio.orm';
import { ContratoOrm } from './contrato.orm';
import { DependenciaOrm } from './dependencia.orm';
import { IngresoOrm } from './ingreso.orm';
import { PacienteOrm } from './paciente.orm';
import { ProveedorOrm } from './proveedor.orm';
import { TerceroOrm } from './tercero.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './area-servicio.orm';
export * from './contrato.orm';
export * from './dependencia.orm';
export * from './ingreso.orm';
export * from './paciente.orm';
export * from './proveedor.orm';
export * from './tercero.orm';
export * from './usuario.orm';

export const LGC_CGT_GEN_ENTITIES = [
  AreaServicioOrm,
  ContratoOrm,
  DependenciaOrm,
  IngresoOrm,
  PacienteOrm,
  ProveedorOrm,
  TerceroOrm,
  UsuarioOrm,
];
