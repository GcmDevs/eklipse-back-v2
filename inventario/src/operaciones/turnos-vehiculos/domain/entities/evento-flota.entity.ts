import { Id } from '@common/domain/value-objects';
import { EntidadEventoFlota } from '../enums';

export class EventoFlota {
  private constructor(
    private readonly id: Id,
    private entidad: EntidadEventoFlota,
    private entidadId: Id,
    private tipoEvento: string,
    private usuarioId: Id | undefined,
    private motivo: string | undefined,
    private detalle: Record<string, unknown> | undefined,
    private readonly createdAt: Date,
  ) {}

  static create(params: {
    entidad: EntidadEventoFlota;
    entidadId: number;
    tipoEvento: string;
    usuarioId?: number;
    motivo?: string;
    detalle?: Record<string, unknown>;
  }): EventoFlota {
    return new EventoFlota(
      new Id(),
      params.entidad,
      new Id(params.entidadId),
      params.tipoEvento,
      params.usuarioId ? new Id(params.usuarioId) : undefined,
      params.motivo,
      params.detalle,
      new Date(),
    );
  }

  static rebuild(
    id: number,
    entidad: EntidadEventoFlota,
    entidadId: number,
    tipoEvento: string,
    usuarioId: number | undefined,
    motivo: string | undefined,
    detalle: Record<string, unknown> | undefined,
    createdAt: Date,
  ): EventoFlota {
    return new EventoFlota(
      new Id(id),
      entidad,
      new Id(entidadId),
      tipoEvento,
      usuarioId ? new Id(usuarioId) : undefined,
      motivo,
      detalle,
      createdAt,
    );
  }

  get getId(): Id { return this.id; }
  get getEntidad(): EntidadEventoFlota { return this.entidad; }
  get getEntidadId(): Id { return this.entidadId; }
  get getTipoEvento(): string { return this.tipoEvento; }
  get getUsuarioId(): Id | undefined { return this.usuarioId; }
  get getMotivo(): string | undefined { return this.motivo; }
  get getDetalle(): Record<string, unknown> | undefined { return this.detalle; }
  get getCreatedAt(): Date { return this.createdAt; }
}
