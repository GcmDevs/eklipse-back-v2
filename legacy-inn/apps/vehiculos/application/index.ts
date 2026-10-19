import {
  EstacionesServicioService,
  SincronizarLoteTanqueosUseCase,
  TanqueoInconsistenciaService,
  TanqueoService,
  VehiculosService,
  RepositorioCombustibleService,
} from './services';

export * from './services';
export * from './helpers';
export * from './types';

export const VEHICULOS_PROVIDERS = [
  VehiculosService,
  TanqueoService,
  TanqueoInconsistenciaService,
  EstacionesServicioService,
  SincronizarLoteTanqueosUseCase,
  RepositorioCombustibleService,
];
