import { OrigenTanqueo, TipoEvidencia } from '../enums';

export const EVIDENCIAS_ABASTECIMIENTO: readonly TipoEvidencia[] = [
  TipoEvidencia.SURTIDOR_INICIAL,
  TipoEvidencia.SURTIDOR_FINAL,
  TipoEvidencia.FACTURA,
];

export const EVIDENCIAS_TANQUEO_ESTACION: readonly TipoEvidencia[] = [
  TipoEvidencia.TABLERO_INICIAL,
];

export const EVIDENCIAS_TANQUEO_REPOSITORIO: readonly TipoEvidencia[] = [
  TipoEvidencia.FOTO_REPO_ANTES,
  TipoEvidencia.FOTO_REPO_DESPUES,
];

export const EVIDENCIAS_LOTE_ESTACION: readonly TipoEvidencia[] = [
  TipoEvidencia.TABLERO_INICIAL,
  TipoEvidencia.SURTIDOR_INICIAL,
  TipoEvidencia.SURTIDOR_FINAL,
  TipoEvidencia.INDICADOR_COMBUSTIBLE_FINAL,
  TipoEvidencia.FACTURA,
];

const EVIDENCIAS_TANQUEO_POR_ORIGEN: Record<OrigenTanqueo, readonly TipoEvidencia[]> = {
  [OrigenTanqueo.ESTACION]: EVIDENCIAS_TANQUEO_ESTACION,
  [OrigenTanqueo.REPOSITORIO]: EVIDENCIAS_TANQUEO_REPOSITORIO,
};

export function getEvidenciasRequeridasTanqueo(
  origen: OrigenTanqueo,
  opciones?: { loteEstacion?: boolean }
): readonly TipoEvidencia[] {
  if (origen === OrigenTanqueo.ESTACION && opciones?.loteEstacion) {
    return EVIDENCIAS_LOTE_ESTACION;
  }
  return EVIDENCIAS_TANQUEO_POR_ORIGEN[origen];
}
