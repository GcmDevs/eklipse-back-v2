import { EstacionServicioOrm } from './estacion-servicio.orm';
import { IdempotencyStoreOrm } from './idempotency-store.orm';
import { SyncLogOrm } from './sync-log.orm';
import { TanqueoInconsistenciaOrm } from './tanqueo-inconsistencia.orm';
import { TanqueoOrm } from './tanqueo.orm';
import { VehiculoOrm } from './vehiculo.orm';
import { AbastecimientoOrm } from './abastecimiento.orm';
import { RepositorioCombustibleOrm } from './repositorio-combustible.orm';
import { MovimientoCombustibleOrm } from './movimiento-combustible.orm';

export * from './estacion-servicio.orm';
export * from './tanqueo.orm';
export * from './tanqueo-inconsistencia.orm';
export * from './sync-log.orm';
export * from './idempotency-store.orm';
export * from './vehiculo.orm';
export * from './abastecimiento.orm';
export * from './repositorio-combustible.orm';
export * from './movimiento-combustible.orm';

export const ORM_INN_VEHICULOS_ENTITIES = [
  VehiculoOrm,
  TanqueoOrm,
  AbastecimientoOrm,
  RepositorioCombustibleOrm,
  MovimientoCombustibleOrm,
  SyncLogOrm,
  TanqueoInconsistenciaOrm,
  IdempotencyStoreOrm,
  EstacionServicioOrm,
];
