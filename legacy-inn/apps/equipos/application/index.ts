import { DomainEquipoEventDispatcher } from './events';
import { AccionHandlerRegistry } from './handlers/accion-handler.registry';
import { ChangeEstadoHandler } from './handlers/change-estado.handler';
import { DarBajaHandler } from './handlers/de-baja.handler';
import {
  AccesorioTipoEquipoService,
  AccesorioUnidadService,
  ActividadesService,
  AreaService,
  ClaseEquipoService,
  CompraService,
  CronogramaService,
  DocumentoCompraService,
  DocumentoTipoEquipoService,
  EquiposLegacyService,
  EquiposService,
  FormatoService,
  MarcaService,
  ModeloService,
  ModifyTipoEquipoService,
  PartesCatgService,
  SyncAccesorioTipoEquipoService,
  PlanDefaultTipoEquipoService,
  RecursoService,
  ReportesActividadService,
  SolicitudService,
  TipoActivoService,
  TipoDocCategoriaActivoService,
  TipoEquipoService,
  UnidadMedidaService,
  RegFotograficoEquiposService,
} from './services';
import { UpdateEquipoHandler } from './handlers/update-datos.handler';
import { EquiposPolicies } from './services/policies/equipos.policies';
import { AuditEquipoService, AuditTipoEquipoService } from './audit';

export * from './types';
export * from './handlers';
export * from './services';

export const EQUIPOS_PROVIDERS = [
  EquiposService,
  EquiposPolicies,
  EquiposLegacyService,
  RegFotograficoEquiposService,
  MarcaService,
  SolicitudService,
  AccionHandlerRegistry,
  ModeloService,
  FormatoService,
  ActividadesService,
  AreaService,
  PartesCatgService,
  CronogramaService,
  RecursoService,
  ReportesActividadService,
  SyncAccesorioTipoEquipoService,
  AuditEquipoService,
  DomainEquipoEventDispatcher,
  ChangeEstadoHandler,
  DarBajaHandler,
  UpdateEquipoHandler,
  TipoActivoService,
  ClaseEquipoService,
  TipoEquipoService,
  ModifyTipoEquipoService,
  AuditTipoEquipoService,
  TipoDocCategoriaActivoService,
  CompraService,
  DocumentoCompraService,
  AccesorioTipoEquipoService,
  PlanDefaultTipoEquipoService,
  DocumentoTipoEquipoService,
  UnidadMedidaService,
  AccesorioUnidadService,
];
