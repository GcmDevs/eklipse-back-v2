import { DiligenciamientoService } from './diligenciamiento.service';
import { EjecucionMantService } from './ejecuciones-mant.service';
import { FormatoEngineService } from './formato-engine.service';
import { SeccionesService } from './seccion.service';

export * from './diligenciamiento.service';
export * from './ejecuciones-mant.service';
export * from './formato-engine.service';
export * from './seccion.service';
export * from './registro-dilg.adapter';

export const MOTOR_FORMATOS_SERVICES = [
  FormatoEngineService,
  DiligenciamientoService,
  EjecucionMantService,
  SeccionesService,
];
