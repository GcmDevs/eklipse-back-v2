import { EstacionServicioOrm } from './estacion-servicio.orm';
import { SyncLogOrm } from './sync-log.orm';
import { TanqueoInconsistenciaOrm } from './tanqueo-inconsistencia.orm';
import { TanqueoOrm } from './tanqueo.orm';
import { VehiculoOrm } from './vehiculo.orm';
import { AbastecimientoOrm } from './abastecimiento.orm';
import { RepositorioCombustibleOrm } from './repositorio-combustible.orm';
import { MovimientoCombustibleOrm } from './movimiento-combustible.orm';
import { LecturaOdometroOrm } from './lectura-odometro.orm';
import { TanqueoCorreccionOrm } from './tanqueo-correccion.orm';
import { TanqueoIntentoOrm } from './tanqueo-intento.orm';
import { TanqueoEvidenciaLogOrm } from './tanqueo-evidencia-log.orm';
import { TanqueoEventoLogOrm } from './tanqueo-evento-log.orm';

export * from './estacion-servicio.orm';
export * from './tanqueo.orm';
export * from './tanqueo-inconsistencia.orm';
export * from './sync-log.orm';
export * from './vehiculo.orm';
export * from './abastecimiento.orm';
export * from './repositorio-combustible.orm';
export * from './movimiento-combustible.orm';
export * from './lectura-odometro.orm';
export * from './tanqueo-correccion.orm';
export * from './tanqueo-intento.orm';
export * from './tanqueo-evidencia-log.orm';
export * from './tanqueo-evento-log.orm';

export const ORM_INN_VEHICULOS_ENTITIES = [
  VehiculoOrm,
  TanqueoOrm,
  AbastecimientoOrm,
  RepositorioCombustibleOrm,
  MovimientoCombustibleOrm,
  SyncLogOrm,
  TanqueoInconsistenciaOrm,
  EstacionServicioOrm,
  LecturaOdometroOrm,
  TanqueoCorreccionOrm,
  TanqueoIntentoOrm,
  TanqueoEvidenciaLogOrm,
  TanqueoEventoLogOrm,
];
