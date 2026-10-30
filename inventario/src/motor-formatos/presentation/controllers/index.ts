import { EjecucionMantController } from './ejecucion-mant.controller';
import { FormatoEngineController } from './formato-engine.controller';
import { DiligenciamientoController } from './diligenciamiento-actividades.controller';
import { SeccionesController } from './seccion.controller';

export * from './formato-engine.controller';
export * from './ejecucion-mant.controller';
export * from './seccion.controller';
export * from './diligenciamiento-actividades.controller';


export const MOTOR_FORMATOS_CONTROLLERS = [
    FormatoEngineController,
    EjecucionMantController,
    SeccionesController,
    DiligenciamientoController
]