import { EstadoEquipo, MotivoCambioEstadoEquipo } from '../enums';
import { TipoEventoAuditEquipo } from '../enums/tipos-audit-equipo.enum';
import { DomainEquipoEvent } from './domain-equipo.base.event';

export class EquipoChangeEstadoEvent extends DomainEquipoEvent {
  readonly tipo = TipoEventoAuditEquipo.CAMBIO_ESTADO;

  constructor(
    readonly equipoId: number,
    readonly estadoAnterior: EstadoEquipo,
    readonly nuevoEstado: EstadoEquipo,
    readonly motivo: MotivoCambioEstadoEquipo,
    readonly observaciones?: string
  ) {
    super();
  }

  get descripcion() {
    return `Estado cambiado de ${this.estadoAnterior} a ${this.nuevoEstado}`;
  }

  get metadata() {
    return {
      estadoAnterior: this.estadoAnterior,
      nuevoEstado: this.nuevoEstado,
      motivo: this.motivo,
      observaciones: this.observaciones,
    };
  }
}
