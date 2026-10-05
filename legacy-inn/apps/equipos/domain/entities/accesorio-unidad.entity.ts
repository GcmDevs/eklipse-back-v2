import { Id } from '@common/domain/value-objects';
import { EstadoAccesorioUnidad } from '@equipos/domain/enums';

export class AccesorioUnidad {
  private constructor(
    private readonly id: Id,
    private equipoId: Id,
    private accesorioEstandarId: Id,
    private parteSnap: string,
    private estado: EstadoAccesorioUnidad,
    private observaciones: string | undefined,
    private descontinuado: boolean,
    private fechaDescontinuado: Date | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    equipoId: number,
    accesorioEstandarId: number,
    parteSnap: string,
    estado?: EstadoAccesorioUnidad,
    observaciones?: string
  ): AccesorioUnidad {
    const now = new Date();
    return new AccesorioUnidad(
      new Id(),
      new Id(equipoId),
      new Id(accesorioEstandarId),
      parteSnap,
      estado ?? EstadoAccesorioUnidad.ENTREGADO,
      observaciones,
      false,
      undefined,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    equipoId: number,
    accesorioEstandarId: number,
    parteSnap: string,
    createdAt: Date,
    updatedAt: Date,
    estado?: EstadoAccesorioUnidad,
    observaciones?: string,
    descontinuado?: boolean,
    fechaDescontinuado?: Date
  ): AccesorioUnidad {
    return new AccesorioUnidad(
      new Id(id),
      new Id(equipoId),
      new Id(accesorioEstandarId),
      parteSnap,
      estado ?? EstadoAccesorioUnidad.ENTREGADO,
      observaciones,
      descontinuado ?? false,
      fechaDescontinuado,
      createdAt,
      updatedAt
    );
  }

  changeEstado(estado: EstadoAccesorioUnidad): void {
    this.estado = estado;
    this.updatedAt = new Date();
  }

  changeObservaciones(observaciones?: string): void {
    this.observaciones = observaciones?.trim() || undefined;
    this.updatedAt = new Date();
  }

  descontinue(): void {
    this.descontinuado = true;
    this.fechaDescontinuado = new Date();
    this.updatedAt = new Date();
  }

  get getId(): Id {
    return this.id;
  }
  get getEquipoId(): Id {
    return this.equipoId;
  }
  get getAccesorioEstandarId(): Id {
    return this.accesorioEstandarId;
  }
  get getParteSnap(): string {
    return this.parteSnap;
  }
  get getEstado(): EstadoAccesorioUnidad {
    return this.estado;
  }
  get getObservaciones(): string | undefined {
    return this.observaciones;
  }
  get getDescontinuado(): boolean {
    return this.descontinuado;
  }
  get getFechaDescontinuado(): Date | undefined {
    return this.fechaDescontinuado;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
