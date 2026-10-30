import { TANQUEOS_UMBRALES } from '../constants/tanqueos-umbrales.config';

export const KM_SALTO_FACTOR = TANQUEOS_UMBRALES.kmSaltoFactor;
export const KM_SALTO_RENDIMIENTO_DEFAULT = TANQUEOS_UMBRALES.kmSaltoRendimientoDefault;

export function umbralSaltoKilometraje(
  capacidadTanque: number | null | undefined,
  rendimientoEsperado: number | null | undefined
): number {
  const rendimiento =
    rendimientoEsperado != null && rendimientoEsperado > 0
      ? rendimientoEsperado
      : KM_SALTO_RENDIMIENTO_DEFAULT;
  const capacidad = capacidadTanque != null && capacidadTanque > 0 ? capacidadTanque : 0;
  if (capacidad <= 0) {
    return Math.round(KM_SALTO_RENDIMIENTO_DEFAULT * KM_SALTO_FACTOR * 50);
  }
  return Math.round(capacidad * rendimiento * KM_SALTO_FACTOR);
}
