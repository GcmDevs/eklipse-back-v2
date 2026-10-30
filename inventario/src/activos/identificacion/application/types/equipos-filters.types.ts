import { EstadoBusquedaEquipo, EstadoEquipo } from "@inn/activos/identificacion/domain/enums";
import { GeneralActivoLegacyView } from "@inn/activos/identificacion/infrastructure/persistence/views/external";

export type FiltersEquipos = {
    tipoActivoId?: number;
    estado?: EstadoEquipo;
    areaId?: number;
    responsablesIds?: number[];
};

export type ResultFindEquipoGlobalSystem = {
    estado: EstadoBusquedaEquipo;
    equipo?: GeneralActivoLegacyView | null;
}