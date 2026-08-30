import { DependenciaOrm } from './dependencia.orm';
import { ProveedorOrm } from './proveedor.orm';
import { TerceroOrm } from './tercero.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './dependencia.orm';
export * from './proveedor.orm';
export * from './tercero.orm';
export * from './usuario.orm';

export const LGC_RCT_GEN_ENTITIES = [DependenciaOrm, ProveedorOrm, TerceroOrm, UsuarioOrm];
