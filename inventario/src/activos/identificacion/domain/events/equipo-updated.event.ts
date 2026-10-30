import { TipoEventoAuditEquipo } from "../enums/tipos-audit-equipo.enum";
import { DomainEquipoEvent } from "./domain-equipo.base.event";

export class EquipoUpdatedEvent extends DomainEquipoEvent {
    readonly tipo = TipoEventoAuditEquipo.EQUIPO_ACTUALIZADO;

    constructor(
        readonly equipoId: number,
        readonly data: Record<string, any>
    ) {
        super();
    }

    get descripcion() {
        return `Informacion del equipo actualizado`;
    }

    get metadata() {
        return { payload: this.data };
    }
}