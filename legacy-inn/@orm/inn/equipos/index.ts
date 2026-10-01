import { GeneralActivoLegacyView } from '@equipos/infrastructure/persistence/views/external';
import { AccesorioUnidadOrm } from './accesorio-unidad.orm';
import { CronogramaOrm, EjecucionExternaOrm, FormatoOrm, PlanActividadOrm, RegistroActividadOrm, ReprogramacionActividadOrm } from './actividades';
import { CompraOrm } from './adquisicion';
import { EquipoBajaOrm } from './baja-equipo.orm';
import {
  AccesorioTipoEquipoOrm,
  AuditTipoEquipoOrm,
  ClaseEquipoOrm,
  DocumentoTipoEquipoOrm,
  ParteCatgOrm,
  PlanDefaultTipoEquipoOrm,
  SubclaseEquipoOrm,
  TipoActivoOrm,
  TipoDocCategoriaActivoOrm,
  TipoEquipoOrm,
  UnidadMedidaOrm,
} from './catalogo';
import { EquipoOrm } from './equipo.orm';
import { EventoAuditEquipoOrm } from './evento-audit-equipo.orm';
import { MarcaOrm, ModeloOrm } from './marca';
import { AsingacionRecursoActividadOrm } from './pool-recursos/asignacion-actividad-recurso.orm';
import { AsignacionRecursoUsuarioOrm } from './pool-recursos/asignacion-usuario-recurso.orm';
import { RecursoOrm } from './pool-recursos/recurso.orm';
import { SolicitudAprobacionOrm } from './solicitud-aprobacion.orm';
import { IncidenciasExternasEquiposGestserView } from './incidencias-externas-equipo-gestser.view';

export * from './accesorio-unidad.orm';
export * from './actividades';
export * from './adquisicion';
export * from './baja-equipo.orm';
export * from './catalogo';
export * from './equipo.orm';
export * from './evento-audit-equipo.orm';
export * from './incidencias-externas-equipo-gestser.view';
export * from './marca';
export * from './solicitud-aprobacion.orm';
export * from './supports';

export const ORM_EQPS_ENTITIES = [
  EquipoOrm,
  MarcaOrm,
  ModeloOrm,
  FormatoOrm,
  EquipoBajaOrm,
  TipoActivoOrm,
  ClaseEquipoOrm,
  SubclaseEquipoOrm,
  TipoEquipoOrm,
  TipoDocCategoriaActivoOrm,
  AccesorioTipoEquipoOrm,
  DocumentoTipoEquipoOrm,
  PlanDefaultTipoEquipoOrm,
  ParteCatgOrm,
  UnidadMedidaOrm,
  CompraOrm,
  AccesorioUnidadOrm,
  GeneralActivoLegacyView,
  PlanActividadOrm,
  RegistroActividadOrm,
  ReprogramacionActividadOrm,
  SolicitudAprobacionOrm,
  RecursoOrm,
  CronogramaOrm,
  AsignacionRecursoUsuarioOrm,
  AsingacionRecursoActividadOrm,
  EjecucionExternaOrm,
  EventoAuditEquipoOrm,
  AuditTipoEquipoOrm,
  IncidenciasExternasEquiposGestserView
];
