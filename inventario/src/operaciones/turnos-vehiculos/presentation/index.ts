import { AmbulanciaFlotaController } from './controllers/ambulancia-flota.controller';
import { FlotaStreamController } from './controllers/flota-stream.controller';
import { LimpiezaDotacionController } from './controllers/limpieza-dotacion.controller';
import { TurnoEntregaController } from './controllers/turno-entrega.controller';

export const FLOTA_CONTROLLERS = [
  AmbulanciaFlotaController,
  TurnoEntregaController,
  LimpiezaDotacionController,
  FlotaStreamController,
];
