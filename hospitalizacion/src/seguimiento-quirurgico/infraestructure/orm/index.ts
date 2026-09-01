import { EstadoCirugiaOrm } from './estado-cirugia.orm';
import { HistorialEstadoCirugiaOrm } from './historial-estado-cirugia.orm';
import { SeguimientoCirugiaOrm } from './seguimiento-cirugia.orm';
import { AsignacionQuirofanoUsuarioOrm } from './asignacion-quirofano-usuario.orm';
import { AgrupadorSalasQuirurgicasOrm } from './agrupador-salas-quirurgicas.orm';
import { AgrupadorSalaQuirurgicaOrm } from './agrupador-sala-quirurgica.orm';
export * from './agrupador-salas-quirurgicas.orm';
export * from './agrupador-sala-quirurgica.orm';
export * from './asignacion-quirofano-usuario.orm';
export * from './estado-cirugia.orm';
export * from './historial-estado-cirugia.orm';
export * from './seguimiento-cirugia.orm';
export const SEGUIMIENTO_QUIRURGICO_ENTITIES = [
  EstadoCirugiaOrm,
  SeguimientoCirugiaOrm,
  HistorialEstadoCirugiaOrm,
  AsignacionQuirofanoUsuarioOrm,
  AgrupadorSalasQuirurgicasOrm,
  AgrupadorSalaQuirurgicaOrm,
];
