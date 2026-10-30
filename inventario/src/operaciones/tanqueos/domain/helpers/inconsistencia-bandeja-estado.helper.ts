import { FiltroEstadoInconsistenciaBandeja } from '../enums/inconsistencia-bandeja.enum';
import { EstadoInconsistencia } from '../enums/estados.enum';

/** `null` = no filtrar por estado (TODAS). */
export function estadoInconsistenciaParaBandeja(
  filtro?: FiltroEstadoInconsistenciaBandeja
): EstadoInconsistencia | null {
  if (!filtro || filtro === FiltroEstadoInconsistenciaBandeja.ABIERTA) {
    return EstadoInconsistencia.ABIERTA;
  }
  if (filtro === FiltroEstadoInconsistenciaBandeja.CERRADA) {
    return EstadoInconsistencia.CERRADA;
  }
  return null;
}
