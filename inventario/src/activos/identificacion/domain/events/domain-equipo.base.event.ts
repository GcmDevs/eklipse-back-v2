import { DomainEventBase } from "@common/application/services";
import { TipoEventoAuditEquipo } from "../enums/tipos-audit-equipo.enum";

export abstract class DomainEquipoEvent extends DomainEventBase {
    abstract readonly tipo: TipoEventoAuditEquipo;
    abstract readonly equipoId: number;
}