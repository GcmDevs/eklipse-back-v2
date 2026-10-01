import { TipoEventoAuditEquipo } from "../enums/tipos-audit-equipo.enum";
import { DomainEquipoEvent } from "./domain-equipo.base.event";

export class ActividadScheduledEvent extends DomainEquipoEvent {
  readonly tipo = TipoEventoAuditEquipo.ACTIVIDAD_PROGRAMADA;

  constructor(
    readonly equipoId: number,
    readonly data: Record<string, any>
  ) {
    super();
  }

  get descripcion() {
    return `Actividad Programada`;
  }

  get metadata() {
    return { payload: this.data };
  }
}

export class ActividadInmediatedEvent extends DomainEquipoEvent {
  readonly tipo = TipoEventoAuditEquipo.ACTIVIDAD_INMEDIATA;

  constructor(
    readonly equipoId: number,
    readonly data: Record<string, any>
  ) {
    super();
  }

  get descripcion() {
    return `Actividad Inmediata`;
  }

  get metadata() {
    return { payload: this.data };
  }
}

