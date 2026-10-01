import { EstadoBusquedaEquipo, EstadoEquipo } from '@equipos/domain/enums';
import { GeneralActivoLegacyView } from '@equipos/infrastructure/persistence/views/external';

export type FiltersEquipos = {
  tipoActivoId?: number;
  estado?: EstadoEquipo;
  areaId?: number;
  responsablesIds?: number[];
};

export type ResultFindEquipoGlobalSystem = {
  estado: EstadoBusquedaEquipo;
  equipo?: GeneralActivoLegacyView | null;
};
