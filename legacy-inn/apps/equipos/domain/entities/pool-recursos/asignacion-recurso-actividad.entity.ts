import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import {
  MotivoAsignacionActividad,
  MotivoFinalizacionAsignacionActividad,
} from '@equipos/domain/enums';

export class AsignacionRecursoActividad {
  private constructor(
    private readonly id: Id,
    private readonly actividadId: Id,
    private readonly recursoId: Id,
    private activa: boolean,
    private readonly fechaAsignacion: Date,
    private fechaFinalizacion: Date | null,
    private readonly asignadoPorId: Id,
    private finalizadoPorId: Id | null,
    private readonly motivoAsignacion: MotivoAsignacionActividad | null,
    private readonly motivoAsignacionDetalle: string | null,
    private motivoFinalizacion: MotivoFinalizacionAsignacionActividad | null,
    private motivoFinalizacionDetalle: string | null,
    private readonly observaciones: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(data: {
    actividadId: number;
    recursoId: number;
    asignadoPorId: number;
    motivoAsignacion?: MotivoAsignacionActividad | null;
    motivoAsignacionDetalle?: string | null;
    observaciones?: string | null;
  }): AsignacionRecursoActividad {
    if (!data.actividadId) throw new BadInputError('La actividad es requerida');
    if (!data.recursoId) throw new BadInputError('El recurso es requerido');
    if (!data.asignadoPorId) throw new BadInputError('El usuario asignador es requerido');

    const now = new Date();
    return new AsignacionRecursoActividad(
      new Id(),
      new Id(data.actividadId),
      new Id(data.recursoId),
      true,
      now,
      null,
      new Id(data.asignadoPorId),
      null,
      data.motivoAsignacion ?? null,
      data.motivoAsignacionDetalle ?? null,
      null,
      null,
      data.observaciones ?? null,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    actividadId: number,
    recursoId: number,
    activa: boolean,
    fechaAsignacion: Date,
    fechaFinalizacion: Date | null,
    asignadoPorId: number,
    finalizadoPorId: number | null,
    motivoAsignacion: MotivoAsignacionActividad | null,
    motivoAsignacionDetalle: string | null,
    motivoFinalizacion: MotivoFinalizacionAsignacionActividad | null,
    motivoFinalizacionDetalle: string | null,
    observaciones: string | null,
    createdAt: Date,
    updatedAt: Date
  ): AsignacionRecursoActividad {
    return new AsignacionRecursoActividad(
      new Id(id),
      new Id(actividadId),
      new Id(recursoId),
      activa,
      fechaAsignacion,
      fechaFinalizacion,
      new Id(asignadoPorId),
      finalizadoPorId ? new Id(finalizadoPorId) : null,
      motivoAsignacion,
      motivoAsignacionDetalle,
      motivoFinalizacion,
      motivoFinalizacionDetalle,
      observaciones,
      createdAt,
      updatedAt
    );
  }

  finalize(data: {
    finalizadoPorId: number;
    motivoFinalizacion?: MotivoFinalizacionAsignacionActividad;
    motivoFinalizacionDetalle?: string;
  }): void {
    if (!this.activa) throw new BadInputError('La asignación ya está finalizada');
    if (!data.finalizadoPorId) throw new BadInputError('El usuario finalizador es requerido');

    this.activa = false;
    this.fechaFinalizacion = new Date();
    this.finalizadoPorId = new Id(data.finalizadoPorId);
    this.motivoFinalizacion = data.motivoFinalizacion ?? null;
    this.motivoFinalizacionDetalle = data.motivoFinalizacionDetalle ?? null;
    this.updatedAt = new Date();
  }

  get getId(): Id {
    return this.id;
  }
  get getActividadId(): Id {
    return this.actividadId;
  }
  get getRecursoId(): Id {
    return this.recursoId;
  }
  get isActiva(): boolean {
    return this.activa;
  }
  get getFechaAsignacion(): Date {
    return this.fechaAsignacion;
  }
  get getFechaFinalizacion(): Date | null {
    return this.fechaFinalizacion;
  }
  get getAsignadoPorId(): Id {
    return this.asignadoPorId;
  }
  get getFinalizadoPorId(): Id | null {
    return this.finalizadoPorId;
  }
  get getMotivoAsignacion(): MotivoAsignacionActividad | null {
    return this.motivoAsignacion;
  }
  get getMotivoAsignacionDetalle(): string | null {
    return this.motivoAsignacion;
  }
  get getMotivoFinalizacion(): MotivoFinalizacionAsignacionActividad | null {
    return this.motivoFinalizacion;
  }
  get getMotivoFinalizacionDetalle(): string | null {
    return this.motivoFinalizacion;
  }
  get getObservaciones(): string | null {
    return this.observaciones;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
