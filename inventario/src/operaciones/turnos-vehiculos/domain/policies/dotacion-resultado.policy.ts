import { EstadoDotacion } from '../enums';
import { DotacionGrillaResultado } from '../read';

export function mapDotacionResultado(
  estado: EstadoDotacion,
  completa?: boolean | null,
  cierreAutomatico?: boolean | null,
  fechaUltimoCierre?: Date | null,
): DotacionGrillaResultado {
  if (estado === EstadoDotacion.EN_CURSO) return 'EN_CURSO';
  if (estado === EstadoDotacion.CERRADA && cierreAutomatico && !fechaUltimoCierre) {
    return 'INCOMPLETA_VENCIDA';
  }
  if (estado === EstadoDotacion.CERRADA && completa) return 'COMPLETA';
  if (estado === EstadoDotacion.CERRADA) return 'INCOMPLETA_MANUAL';
  return 'INCOMPLETA_MANUAL';
}

export function borradorDescartadoDotacion(
  cierreAutomatico?: boolean | null,
  fechaUltimoCierre?: Date | null,
): boolean {
  return !!cierreAutomatico && !!fechaUltimoCierre;
}
