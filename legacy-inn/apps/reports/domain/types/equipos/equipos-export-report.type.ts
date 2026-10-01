import { EstadoEquipo } from '@equipos/domain/enums';
import { CustomExportColumn } from './equipos-export.const';

export interface EquiposExportFilters {
  tipoActivoIds?: number[];
  claseIds?: number[];
  subclaseIds?: number[];
  tipoEquipoIds?: number[];
  estadoEquipo?: EstadoEquipo[];
  localizacion?: string | null;
  responsableIds?: number[];
  compraIds?: number[];
  fechaAdquisicionDesde?: string | null;
  fechaAdquisicionHasta?: string | null;
}

export interface EquiposCustomReportInput {
  filtros: EquiposExportFilters;
  columnas?: CustomExportColumn[];
}

export interface EquiposInventarioReportInput {
  filtros: EquiposExportFilters;
}

export type EquipoExportRow = Record<CustomExportColumn, string>;
