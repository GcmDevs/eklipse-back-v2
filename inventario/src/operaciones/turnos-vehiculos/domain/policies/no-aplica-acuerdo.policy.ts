import { NoAplicaAcuerdo, RespuestaEntregaItem } from '../enums';

export function resolveNoAplicaAcuerdo(
  respuestaEntrega?: string | null,
  respuestaRecepcion?: string | null,
): NoAplicaAcuerdo | null {
  const entregaNoAplica = respuestaEntrega === RespuestaEntregaItem.NO_APLICA;
  const recepcionNoAplica = respuestaRecepcion === RespuestaEntregaItem.NO_APLICA;
  if (!entregaNoAplica && !recepcionNoAplica) return null;
  if (entregaNoAplica && recepcionNoAplica) return NoAplicaAcuerdo.ACORDADO;
  return NoAplicaAcuerdo.SIN_ACUERDO;
}
