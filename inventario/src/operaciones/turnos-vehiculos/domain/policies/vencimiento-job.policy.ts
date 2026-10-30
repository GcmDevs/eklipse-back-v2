export const VENCIMIENTO_JOB_NAMESPACE = 'flota.vencimiento';

export type TipoVencimientoFlota =
  | 'DOTACION'
  | 'ENTREGA_DECL'
  | 'ENTREGA_RECEPCION'
  | 'ENTREGA_CIERRE';

export const TIPOS_VENCIMIENTO_FLOTA: readonly TipoVencimientoFlota[] = [
  'DOTACION',
  'ENTREGA_DECL',
  'ENTREGA_RECEPCION',
  'ENTREGA_CIERRE',
];

/** Tolerancia al comparar el plazo del job con el guardado en SQL (redondeo de datetime). */
export const TOLERANCIA_PLAZO_MS = 1_000;

export type DecisionVencimientoJob =
  | 'EJECUTAR'
  | 'OMITIR_NO_PENDIENTE'
  | 'OMITIR_PLAZO_CAMBIADO'
  | 'REINTENTAR_AUN_NO_VENCE';

/** Clave lógica estable del job: un job por (tipo, entidad). El tenant va en el scope. */
export const vencimientoJobKey = (tipo: TipoVencimientoFlota, entidadId: number): string =>
  `${tipo}-${entidadId}`;

/**
 * Decide qué hacer cuando un job diferido despierta. SQL Server es la fuente de verdad:
 * el job solo "avisa", y el plazo guardado manda.
 *
 * - No pendiente (inexistente, cerrado, bloqueado...): nada que hacer.
 * - Plazo distinto al del job: el plazo cambió después de programarlo; este job es viejo.
 *   Existe (o existirá por reconciliación) otro job con el plazo vigente.
 * - Aún no vence (deriva de relojes entre Redis, app y SQL): reintentar con backoff.
 */
export function decidirVencimientoJob(input: {
  pendiente: boolean;
  fechaLimiteActual: Date | null;
  fechaLimiteEsperada: Date;
  now: Date;
}): DecisionVencimientoJob {
  const { pendiente, fechaLimiteActual, fechaLimiteEsperada, now } = input;
  if (!pendiente || !fechaLimiteActual) return 'OMITIR_NO_PENDIENTE';
  if (
    Math.abs(fechaLimiteActual.getTime() - fechaLimiteEsperada.getTime()) > TOLERANCIA_PLAZO_MS
  ) {
    return 'OMITIR_PLAZO_CAMBIADO';
  }
  if (now.getTime() < fechaLimiteActual.getTime()) return 'REINTENTAR_AUN_NO_VENCE';
  return 'EJECUTAR';
}
