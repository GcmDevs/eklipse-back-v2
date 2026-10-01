import { UnidadTiempo } from '@equipos/domain/enums';
import { PeriodoDeTiempo } from '@equipos/domain/value-objects';

export function buildPeriocidad(
  periocidad?: { valor?: number; unidad?: UnidadTiempo } | null
): PeriodoDeTiempo | null {
  return periocidad?.valor != null && periocidad?.unidad != null
    ? PeriodoDeTiempo.create(periocidad.valor, periocidad.unidad)
    : null;
}
