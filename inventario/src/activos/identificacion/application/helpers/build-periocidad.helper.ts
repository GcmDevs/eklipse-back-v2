import { UnidadTiempo } from "@inn/activos/identificacion/domain/enums";
import { PeriodoDeTiempo } from "@inn/activos/identificacion/domain/value-objects";

export function buildPeriocidad(periocidad?: { valor?: number; unidad?: UnidadTiempo } | null): PeriodoDeTiempo | null {
    return periocidad?.valor != null && periocidad?.unidad != null
        ? PeriodoDeTiempo.create(periocidad.valor, periocidad.unidad)
        : null;
}
