import { EstacionServicioController } from './estacion-servicio.controller';
import { RepositorioCombustibleController } from './repositorio-combustible.controller';
import { TanqueoController } from './tanqueo.controller';
import { TanqueoInconsistenciaController } from './tanqueo-inconsistencia.controller';
import { VehiculoController } from './vehiculos.controller';

export * from './tanqueo.controller';
export * from './vehiculos.controller';
export * from './estacion-servicio.controller';
export * from './tanqueo-inconsistencia.controller';
export * from './repositorio-combustible.controller';

export const VEHICULOS_CONTROLLERS = [
  TanqueoController,
  TanqueoInconsistenciaController,
  VehiculoController,
  EstacionServicioController,
  RepositorioCombustibleController,
];
