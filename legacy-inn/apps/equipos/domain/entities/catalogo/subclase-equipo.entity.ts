import { Id, normalizeUppercaseText } from '@common/domain/value-objects';

export class SubclaseEquipo {
  private constructor(
    private readonly id: Id,
    private claseId: Id,
    private nombre: string,
    private codigo: string,
    private descripcion: string | undefined,
    private activo: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    claseId: number,
    nombre: string,
    codigo: string,
    descripcion?: string,
    activo: boolean = true
  ): SubclaseEquipo {
    const now = new Date();
    return new SubclaseEquipo(
      new Id(),
      new Id(claseId),
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
    claseId: number,
    nombre: string,
    codigo: string,
    createdAt: Date,
    updatedAt: Date,
    descripcion?: string,
    activo?: boolean
  ): SubclaseEquipo {
    return new SubclaseEquipo(
      new Id(id),
      new Id(claseId),
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

  update(data: { claseId?: number; nombre?: string; codigo?: string; descripcion?: string }): void {
    if (data.claseId !== undefined) this.claseId = new Id(data.claseId);
    if (data.nombre !== undefined) this.nombre = normalizeUppercaseText(data.nombre);
    if (data.codigo !== undefined) this.codigo = normalizeUppercaseText(data.codigo);
    if (data.descripcion !== undefined) this.descripcion = data.descripcion;
    this.updatedAt = new Date();
  }

  get getId(): Id {
    return this.id;
  }
  get getClaseId(): Id {
    return this.claseId;
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
