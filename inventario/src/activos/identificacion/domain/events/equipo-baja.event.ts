import { EstadoEquipo } from "../enums";
import { TipoEventoAuditEquipo } from "../enums/tipos-audit-equipo.enum";
import { DomainEquipoEvent } from "./domain-equipo.base.event";

export class EquipoBajaEvent extends DomainEquipoEvent {
    readonly tipo = TipoEventoAuditEquipo.BAJA;

    constructor(
        readonly equipoId: number,
        readonly estadoAnterior: EstadoEquipo,
    ) {
        super();
    }

    get descripcion() {
        return `Equipo dado de baja, ${this.estadoAnterior} a ${EstadoEquipo.DE_BAJA}`;
    }

    get metadata() {
        return { estadoAnterior: this.estadoAnterior, nuevoEstado: EstadoEquipo.DE_BAJA };
    }
}