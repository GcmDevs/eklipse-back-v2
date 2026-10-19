import { AsignacionConteoOrm } from './asignacion-conteo.orm';
import { ConteoInventarioOrm } from './conteo-inventario.orm';
import { DetalleConteoOrm } from './detalle-conteo.orm';
import { EstanteInventarioOrm } from './estantes-inventario.orm';
import { ProductoEstantesOrm } from './producto-estante.orm';
import { ProductoInventarioOrm } from './productos-inventario.orm';
import { UsuarioConteoOrm } from './usuario-inventario.orm';
import { CicloInventarioOrm } from './ciclo-inventario.orm';
import { CambioEstanteOrm } from './cambio-estante.orm';

export * from './estantes-inventario.orm';
export * from './productos-inventario.orm';
export * from './producto-estante.orm';
export * from './asignacion-conteo.orm';
export * from './usuario-inventario.orm';
export * from './conteo-inventario.orm';
export * from './detalle-conteo.orm';
export * from './ciclo-inventario.orm';
export * from './cambio-estante.orm';

export const ORM_INN_CONTEO_ENTITIES = [
  EstanteInventarioOrm,
  ProductoInventarioOrm,
  ProductoEstantesOrm,
  AsignacionConteoOrm,
  UsuarioConteoOrm,
  ConteoInventarioOrm,
  DetalleConteoOrm,
  CicloInventarioOrm,
  CambioEstanteOrm,
];
