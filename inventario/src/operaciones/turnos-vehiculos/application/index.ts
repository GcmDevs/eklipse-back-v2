import { FlotaDailyJob } from './jobs/flota-daily.job';
import { FlotaVencimientoJobHandler } from './jobs/flota-vencimiento.job-handler';
import { FlotaVencimientoReconciliacionJob } from './jobs/flota-vencimiento-reconciliacion.job';
import { FlotaTareaDiariaService } from './services/flota-tarea-diaria.service';
import { VencimientoProgramacionService } from './services/vencimiento-programacion.service';
import { FlotaSearchService } from './helpers/flota-search.service';
import { DotacionNovedadSyncService } from './helpers/dotacion-novedad-sync.service';
import { FlotaViewBuilderService } from './helpers/flota-view-builder.service';
import { AmbEventoService } from './services/amb-evento.service';
import { AmbulanciaFlotaService } from './services/ambulancia-flota.service';
import { DotacionService } from './services/dotacion.service';
import { EntregaService } from './services/entrega.service';
import { FlotaSseBus } from './services/flota-sse.bus';
import { LimpiezaService } from './services/limpieza.service';
import { NovedadService } from './services/novedad.service';
import { PlantillaService } from './services/plantilla.service';
import { TableroService } from './services/tablero.service';
import { TurnoService } from './services/turno.service';
import { MiTurnoService } from './services/mi-turno.service';
import { FlotaAdminService } from './services/flota-admin.service';
import { VencimientoService } from './services/vencimiento.service';
export * from './services/plantilla.service';
export * from './services/ambulancia-flota.service';
export * from './services/turno.service';
export * from './services/entrega.service';
export * from './services/limpieza.service';
export * from './services/dotacion.service';
export * from './services/novedad.service';
export * from './services/amb-evento.service';
export * from './services/vencimiento.service';
export * from './services/vencimiento-programacion.service';
export * from './services/flota-tarea-diaria.service';
export * from './services/flota-sse.bus';
export * from './services/tablero.service';
export * from './services/mi-turno.service';
export * from './services/flota-admin.service';

export const FLOTA_PROVIDERS = [
  FlotaSearchService,
  DotacionNovedadSyncService,
  FlotaViewBuilderService,
  PlantillaService,
  AmbulanciaFlotaService,
  TableroService,
  TurnoService,
  MiTurnoService,
  FlotaAdminService,
  EntregaService,
  LimpiezaService,
  DotacionService,
  NovedadService,
  AmbEventoService,
  VencimientoService,
  VencimientoProgramacionService,
  FlotaTareaDiariaService,
  FlotaSseBus,
  // Estáticos (sin dependencias request-scoped): se registran al iniciar la app.
  FlotaVencimientoJobHandler,
  FlotaVencimientoReconciliacionJob,
  FlotaDailyJob,
];
