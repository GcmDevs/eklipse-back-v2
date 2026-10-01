import { WorkflowOrderBy } from "@equipos/presentation/dto";
import { EventoAuditEquipoOrm } from "@orm/inn/equipos/evento-audit-equipo.orm";
import { TipoEventoAuditEquipo } from "../enums/tipos-audit-equipo.enum";
import { EventoAuditEquipoRead, EventoAuditEquipoWorkflowRead, IncidenciaExternaEquipoRead } from "../read";

export interface EventoAuditEquipoRepository {
    save(evento: Omit<EventoAuditEquipoOrm, 'id'>): Promise<EventoAuditEquipoRead>;
    findMaxSecuenciaByCorrelationId(correlationId: string): Promise<number>;
    findByEquipo(
        equipoId: number,
        page: number,
        limit: number,
        tipo?: TipoEventoAuditEquipo,
    ): Promise<[EventoAuditEquipoRead[], number]>;
    findWorkflowsByEquipoQuery(
        equipoId: number,
        page: number,
        limit: number,
        orderBy: WorkflowOrderBy,
    ): Promise<[EventoAuditEquipoWorkflowRead[], number]>;
    findIncidenciasExternasByEquipo(
        equipoId: number
    ): Promise<IncidenciaExternaEquipoRead[]>;
}
