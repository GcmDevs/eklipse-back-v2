import { TipoEventoAuditEquipo } from '../enums/tipos-audit-equipo.enum';

export interface EventoAuditEquipoRead {
  id: number;
  equipoId: number;

  tipo: TipoEventoAuditEquipo;
  descripcion: string;

  metadata?: Record<string, any> | null;

  actor?: {
    id?: number | null;
    nombreCompleto?: string | null;
  };
  secuencia?: number | null;

  createdAt: Date;
}

export interface EventoAuditEquipoWorkflowRead {
  correlationId: string;
  eventos: EventoAuditEquipoRead[];
  latestEventoId: number;
  lastActivityAt: Date;
  totalEventos: number;
  rootActivityAt: Date;
}

export interface IncidenciaExternaEquipoRead {
  solicitudId: number;
  adnCentroAtencion: number;
  fechaCreacion: Date;
  ubicacion: string | null;
  prioridad: number | null;
  usuarioSolicita: {
    id: number | null;
    documento: string | null;
    nombre: string | null;
  };
  dependencia: {
    id: number | null;
    nombre: string | null;
  };
  itemId: number | null;
  activoId: number | null;
  placa: string | null;
  adnIngreso: number | null;
  observacion: string | null;
  tipoServicioTecnico: number | null;
  claseServicioTecnico: number | null;
  tipoMantenimiento: number | null;
  tipoTarea: {
    codigo: number | null;
    descripcion: string | null;
  };
  estado: {
    codigo: number | null;
    descripcion: string | null;
  };
}
