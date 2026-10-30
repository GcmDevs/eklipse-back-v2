import { EstacionServicioController } from './estacion-servicio.controller';

import { AbastecimientoController } from './abastecimiento.controller';

import { RepositorioCombustibleController } from './repositorio-combustible.controller';

import { TanqueoController } from './tanqueo.controller';

import { VehiculoController } from './vehiculos.controller';

export * from './tanqueo.controller';

export * from './vehiculos.controller';

export * from './estacion-servicio.controller';

export * from './repositorio-combustible.controller';

export const VEHICULOS_CONTROLLERS = [
  TanqueoController,

  RepositorioCombustibleController,

  AbastecimientoController,

  VehiculoController,

  EstacionServicioController,
];
