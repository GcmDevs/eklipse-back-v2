import { BoletaQuirurgicaAuditoriaOrm } from './autorizacion.orm';
import { BoletaQuirurgicaGestorQxOrm } from './gestor-qx.orm';
import { BoletaQuirurgicaLogOrm } from './log.orm';
import { BoletaQuirurgicaMaosOrm } from './maos.orm';
import { BoletaQuirurgicaObservacionOrm } from './observacion.orm';
import { BoletaQuirurgicaProgramacionOrm } from './programacion.orm';
import { BoletaQuirurgicaRegistroOrm } from './registro.orm';

export * from './autorizacion.orm';
export * from './gestor-qx.orm';
export * from './log.orm';
export * from './maos.orm';
export * from './observacion.orm';
export * from './programacion.orm';
export * from './registro.orm';

export const BOLETA_QUIRURGICA_ENTITIES = [
  BoletaQuirurgicaAuditoriaOrm,
  BoletaQuirurgicaGestorQxOrm,
  BoletaQuirurgicaLogOrm,
  BoletaQuirurgicaMaosOrm,
  BoletaQuirurgicaObservacionOrm,
  BoletaQuirurgicaProgramacionOrm,
  BoletaQuirurgicaRegistroOrm,
];
