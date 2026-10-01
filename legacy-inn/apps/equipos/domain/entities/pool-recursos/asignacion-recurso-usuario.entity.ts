import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { MotivoAsignacionRecursoUsuario, MotivoFinalizacionAsignacionRecursoUsuario } from '@equipos/domain/enums';

export class AsignacionRecursoUsuario {
  private constructor(
    private readonly id: Id,
    private readonly recursoId: Id,
    private readonly usuarioId: Id,
    private readonly fechaInicio: Date,
    private fechaFin: Date | null,
    private activa: boolean,
    private readonly motivoAsignacion: MotivoAsignacionRecursoUsuario | null,
    private readonly motivoAsignacionDetalle: string | null,
    private motivoFinalizacion: MotivoFinalizacionAsignacionRecursoUsuario | null,
    private motivoFinalizacionDetalle: string | null,
    private readonly asignadoPorId: Id,
    private finalizadoPorId: Id,
    private readonly createdAt: Date,
    private observaciones?: string
  ) { }

  static create(data: {
    recursoId: number;
    usuarioId: number;
    fechaInicio: Date;
    asignadoPorId: number;
    motivoAsignacion?: MotivoAsignacionRecursoUsuario | null;
    motivoAsignacionDetalle?: string | null;
    observaciones?: string
  }): AsignacionRecursoUsuario {
    return new AsignacionRecursoUsuario(
      new Id(),
      new Id(data.recursoId),
      new Id(data.usuarioId),
      data.fechaInicio,
      null,
      true,
      data.motivoAsignacion ?? null,
      data.motivoAsignacionDetalle ?? null,
      null, null,
      new Id(data.asignadoPorId),
      null,
      new Date(),
      data?.observaciones
    );
  }

  static rebuild(
    id: number,
    recursoId: number,
    usuarioId: number,
    fechaInicio: Date,
    fechaFin: Date | null,
    activa: boolean,
    motivoAsignacion: MotivoAsignacionRecursoUsuario | null,
    motivoAsignacionDetalle: string | null,
    motivoFinalizacion: MotivoFinalizacionAsignacionRecursoUsuario | null,
    motivoFinalizacionDetalle: string | null,
    asignadoPorId: number,
    finalizadoPorId: number,
    createdAt: Date,
    observaciones?: string
  ): AsignacionRecursoUsuario {
    return new AsignacionRecursoUsuario(
      new Id(id),
      new Id(recursoId),
      new Id(usuarioId),
      fechaInicio,
      fechaFin,
      activa,
      motivoAsignacion,
      motivoAsignacionDetalle,
      motivoFinalizacion,
      motivoFinalizacionDetalle,
      new Id(asignadoPorId),
      finalizadoPorId ? new Id(finalizadoPorId) : null,
      createdAt,
      observaciones
    );
  }

  finalize(data: {
    finalizadoPorId: number;
    motivoFinalizacion: MotivoFinalizacionAsignacionRecursoUsuario;
    motivoFinalizacionDetalle?: string;
  }): void {

    if (!this.activa) {
      throw new BadInputError(
        'La asignación ya fue finalizada'
      );
    }

    this.activa = false;
    this.fechaFin = new Date();
    this.finalizadoPorId = new Id(data.finalizadoPorId);
    this.motivoFinalizacion = data.motivoFinalizacion;
    this.motivoFinalizacionDetalle =
      data.motivoFinalizacionDetalle ?? null;
  }

  get getId(): Id { return this.id; }
  get getRecursoId(): Id { return this.recursoId; }
  get getUsuarioId(): Id { return this.usuarioId; }
  get getFechaInicio(): Date { return this.fechaInicio; }
  get getFechaFin(): Date | null { return this.fechaFin; }
  get isActiva(): boolean { return this.activa; }
  get getMotivoAsignacion(): MotivoAsignacionRecursoUsuario | null { return this.motivoAsignacion; }
  get getMotivoAsignacionDetalle(): string | null { return this.motivoAsignacionDetalle; }
  get getMotivoFinalizacion(): MotivoFinalizacionAsignacionRecursoUsuario | null { return this.motivoFinalizacion; }
  get getMotivoFinalizacionDetalle(): string | null { return this.motivoFinalizacionDetalle; }
  get getAsignadoPorId(): Id { return this.asignadoPorId; }
  get getFinalizadoPorId(): Id | null { return this.finalizadoPorId; }
  get getObservaciones(): string | undefined { return this.observaciones; }
  get getCreatedAt(): Date { return this.createdAt; }
}

