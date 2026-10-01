import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { CoordenadasGPS } from '../value-objects';

export class EstacionServicio {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private direccion: string,
    private observaciones: string | null,
    private municipioId: Id | null,
    private ubicacion: CoordenadasGPS | null,
    private activa: boolean,
    private creadaPorUsuarioId: Id | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    nombre: string,
    direccion: string,
    observaciones?: string | null,
    municipioId?: number | null,
    ubicacion?: CoordenadasGPS | null,
    creadaPorUsuarioId?: number | null
  ): EstacionServicio {
    if (!nombre || nombre.trim().length === 0) {
      throw new BadInputError('El nombre de la estación de servicio es requerido');
    }

    if (!direccion || direccion.trim().length === 0) {
      throw new BadInputError('La dirección de la estación de servicio es requerida');
    }

    const now = new Date();

    return new EstacionServicio(
      new Id(),
      normalizeUppercaseText(nombre),
      normalizeUppercaseText(direccion),
      observaciones?.trim() ?? null,
      municipioId ? new Id(municipioId) : null,
      ubicacion ?? null,
      true,
      creadaPorUsuarioId ? new Id(creadaPorUsuarioId) : null,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    nombre: string,
    direccion: string,
    observaciones: string | null,
    municipioId: number | null,
    ubicacion: CoordenadasGPS | null,
    activa: boolean,
    creadaPorUsuarioId: number | null,
    createdAt: Date,
    updatedAt: Date
  ): EstacionServicio {
    return new EstacionServicio(
      new Id(id),
      nombre,
      direccion,
      observaciones,
      municipioId ? new Id(municipioId) : null,
      ubicacion,
      activa,
      creadaPorUsuarioId ? new Id(creadaPorUsuarioId) : null,
      createdAt,
      updatedAt
    );
  }

  update(data: {
    nombre?: string;
    direccion?: string;
    observaciones?: string | null;
    municipioId?: number | null;
    ubicacion?: CoordenadasGPS | null;
  }): void {
    if (data.nombre !== undefined) {
      this.nombre = normalizeUppercaseText(data.nombre);
    }

    if (data.direccion !== undefined) {
      this.direccion = normalizeUppercaseText(data.direccion);
    }

    if (data.observaciones !== undefined) {
      this.observaciones = data.observaciones?.trim() ?? null;
    }

    if (data.municipioId !== undefined) {
      this.municipioId = data.municipioId === null ? null : new Id(data.municipioId);
    }

    if (data.ubicacion !== undefined) {
      this.ubicacion = data.ubicacion;
    }

    this.updatedAt = new Date();
  }

  activate(): void {
    this.activa = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.activa = false;
    this.updatedAt = new Date();
  }

  hasUbicacion(): boolean {
    return this.ubicacion !== null;
  }

  get getId(): Id {
    return this.id;
  }

  get getNombre(): string {
    return this.nombre;
  }

  get getDireccion(): string {
    return this.direccion;
  }

  get getObservaciones(): string | null {
    return this.observaciones;
  }

  get getMunicipioId(): Id | null {
    return this.municipioId;
  }

  get getUbicacion(): CoordenadasGPS | null {
    return this.ubicacion;
  }

  get getActiva(): boolean {
    return this.activa;
  }

  get getCreadaPorUsuarioId(): Id | null {
    return this.creadaPorUsuarioId;
  }

  get getCreatedAt(): Date {
    return this.createdAt;
  }

  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
