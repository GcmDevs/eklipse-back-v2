import { AccesorioUnidadController } from './accesorio-unidad.controller';
import { ActividadesController, CronogramaController, DashboardController, FormatoController, RecursoController } from './actividades';
import {
  ClaseEquipoController,
  CompraController,
  PartesCatgController,
  TipoActivoController,
  TipoDocCategoriaActivoController,
  TipoEquipoController,
  UnidadMedidaController,
} from './catalogo';
import { EquiposController } from './equipos.controller';
import { EventoAuditEquipoController } from './eventos-audit-equipos.controller';
import { AreaController } from './external';
import { MarcaController, ModeloController } from './marca';
import { RegFotograficoEquiposController } from './reg-fotogratico-equipos.controller';
import { SolicitudesController } from './solicitudes.controller';

export * from './accesorio-unidad.controller';
export * from './actividades';
export * from './catalogo';
export * from './equipos.controller';
export * from './eventos-audit-equipos.controller';
export * from './external';
export * from './marca';
export * from './solicitudes.controller';
export * from './reg-fotogratico-equipos.controller';

export const EQUIPOS_CONTROLLERS = [
  AreaController,
  FormatoController,
  SolicitudesController,
  CronogramaController,
  RecursoController,
  MarcaController,
  ModeloController,
  ActividadesController,
  DashboardController,
  PartesCatgController,
  EquiposController,
  RegFotograficoEquiposController,
  EventoAuditEquipoController,
  TipoActivoController,
  ClaseEquipoController,
  TipoEquipoController,
  TipoDocCategoriaActivoController,
  CompraController,
  UnidadMedidaController,
  AccesorioUnidadController,
];
