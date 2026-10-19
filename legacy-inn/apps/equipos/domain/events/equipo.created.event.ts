import { TipoEventoAuditEquipo } from '../enums/tipos-audit-equipo.enum';
import { DomainEquipoEvent } from './domain-equipo.base.event';

export class EquipoCreatedEvent extends DomainEquipoEvent {
  readonly tipo = TipoEventoAuditEquipo.EQUIPO_CREADO;

  constructor(
    readonly equipoId: number,
    readonly data: Record<string, any>
  ) {
    super();
  }

  get descripcion() {
    return `Equipo Creado`;
  }

  get metadata() {
    return { payload: this.data };
  }
}

export class EquipoImportedEvent extends DomainEquipoEvent {
  readonly tipo = TipoEventoAuditEquipo.EQUIPO_IMPORTADO;

  constructor(
    readonly equipoId: number,
    readonly data: Record<string, any>,
    readonly legacy: {
      generalActivoId: number;
      activoId: number;
      numeroPlaca: string;
    }
  ) {
    super();
  }

  get descripcion() {
    return `Equipo Importado`;
  }

  get metadata() {
    return { payload: this.data, legacy: this.legacy };
  }
}
