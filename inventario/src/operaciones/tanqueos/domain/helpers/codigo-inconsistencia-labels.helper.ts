import { CodigoInconsistencia } from '../enums';

const DESCRIPCIONES: Record<CodigoInconsistencia, string> = {
  [CodigoInconsistencia.EVI_OMIT_MOT]: 'Evidencia omitida con motivo',
  [CodigoInconsistencia.EVI_OMIT]: 'Evidencia omitida sin justificación',
  [CodigoInconsistencia.EVI_NOLEG]: 'Evidencia no legible',
  [CodigoInconsistencia.KM_MENOR_ANT]: 'Kilometraje menor al anterior',
  [CodigoInconsistencia.KM_SALTO]: 'Salto excesivo de kilometraje',
  [CodigoInconsistencia.CANT_COMB_CAP]: 'Cantidad de combustible superior a la capacidad',
  [CodigoInconsistencia.VALOR_ALTO_INU]: 'Valor pagado inusualmente alto',
  [CodigoInconsistencia.TQ_DUP]: 'Posible tanqueo duplicado',
  [CodigoInconsistencia.UBIC_FUERA_RAD]: 'Ubicación fuera del radio de la estación',
  [CodigoInconsistencia.UBIC_DISCREP]: 'Discrepancia entre ubicación inicial y final',
  [CodigoInconsistencia.UBIC_NO_CONC]: 'Validación de ubicación no concluyente',
};

export function getDescripcionInconsistencia(
  codigo: CodigoInconsistencia,
  campo?: string | null
): string {
  const base = DESCRIPCIONES[codigo] ?? codigo;
  if (!campo?.trim()) return base;
  return `${base} (${campo})`;
}
