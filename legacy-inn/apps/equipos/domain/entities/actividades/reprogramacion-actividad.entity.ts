import { Id } from '@common/domain/value-objects';
import { MotivoReprogramacionActividad } from '@equipos/domain/enums';

export class ReprogramacionActividad {
  private constructor(
    private readonly id: Id,
    private planActividadId: Id,
    private equipoId: Id,
    private registroActividad: Id,
    private motivo: MotivoReprogramacionActividad,
    private fechaProgramaOriginal: Date,
    private fechaReprogramada: Date,
    private activa: boolean,
    private createdAt: Date,
    private updatedAt: Date,
    private motivoDetalle?: string
  ) {}

  static create(
    planActividadId: number,
    equipoId: number,
    registroActividadId: number,
    motivo: MotivoReprogramacionActividad,
    fechaProgramaOriginal: Date,
    fechaReprogramada: Date,
    motivoDetalle?: string
  ) {
    return new ReprogramacionActividad(
      new Id(),
      new Id(planActividadId),
      new Id(equipoId),
      new Id(registroActividadId),
      motivo,
      fechaProgramaOriginal,
      fechaReprogramada,
      true,
      new Date(),
      new Date(),
      motivoDetalle
    );
  }

  static rebuild(
    id: number,
    planActividadId: number,
    equipoId: number,
    registroActividadId: number,
    motivo: MotivoReprogramacionActividad,
    fechaProgramaOriginal: Date,
    fechaReprogramada: Date,
    activa: boolean,
    createdAt: Date,
    updatedAt: Date,
    motivoDetalle?: string
  ) {
    return new ReprogramacionActividad(
      new Id(id),
      new Id(planActividadId),
      new Id(equipoId),
      new Id(registroActividadId),
      motivo,
      fechaProgramaOriginal,
      fechaReprogramada,
      activa,
      createdAt,
      updatedAt,
      motivoDetalle
    );
  }

  deactivate() {
    this.activa = false;
    this.updatedAt = new Date();
  }

  isActiva(): boolean {
    return this.activa;
  }

  get getId(): Id {
    return this.id;
  }

  get getplanActividadId(): Id {
    return this.planActividadId;
  }

  get getEquipoId(): Id {
    return this.equipoId;
  }

  get getRegistroActividad(): Id {
    return this.registroActividad;
  }

  get getFechaProgramaOriginal(): Date {
    return this.fechaProgramaOriginal;
  }

  get getFechaReprogramada(): Date {
    return this.fechaReprogramada;
  }

  get getMotivo(): MotivoReprogramacionActividad {
    return this.motivo;
  }

  get getMotivoDetalle(): string | undefined {
    return this.motivoDetalle;
  }

  get getActiva(): boolean {
    return this.activa;
  }

  get getCreatedAt(): Date {
    return this.createdAt;
  }

  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
