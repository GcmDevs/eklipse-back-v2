import { Id, normalizeUppercaseText } from '@common/domain/value-objects';

export class ClaseEquipo {
  private constructor(
    private readonly id: Id,
    private tipoActivoId: Id,
    private nombre: string,
    private codigo: string,
    private descripcion: string | undefined,
    private activo: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    tipoActivoId: number,
    nombre: string,
    codigo: string,
    descripcion?: string,
    activo: boolean = true
  ): ClaseEquipo {
    const now = new Date();
    return new ClaseEquipo(
      new Id(),
      new Id(tipoActivoId),
      normalizeUppercaseText(nombre),
      normalizeUppercaseText(codigo),
      descripcion,
      activo,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    tipoActivoId: number,
    nombre: string,
    codigo: string,
    createdAt: Date,
    updatedAt: Date,
    descripcion?: string,
    activo?: boolean
  ): ClaseEquipo {
    return new ClaseEquipo(
      new Id(id),
      new Id(tipoActivoId),
      nombre,
      codigo,
      descripcion,
      activo ?? true,
      createdAt,
      updatedAt
    );
  }

  desactivar(): void {
    this.activo = false;
    this.updatedAt = new Date();
  }

  update(data: {
    tipoActivoId?: number;
    nombre?: string;
    codigo?: string;
    descripcion?: string;
  }): void {
    if (data.tipoActivoId !== undefined) this.tipoActivoId = new Id(data.tipoActivoId);
    if (data.nombre !== undefined) this.nombre = normalizeUppercaseText(data.nombre);
    if (data.codigo !== undefined) this.codigo = normalizeUppercaseText(data.codigo);
    if (data.descripcion !== undefined) this.descripcion = data.descripcion;
    this.updatedAt = new Date();
  }

  get getId(): Id {
    return this.id;
  }
  get getTipoActivoId(): Id {
    return this.tipoActivoId;
  }
  get getNombre(): string {
    return this.nombre;
  }
  get getCodigo(): string {
    return this.codigo;
  }
  get getDescripcion(): string | undefined {
    return this.descripcion;
  }
  get getActivo(): boolean {
    return this.activo;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
