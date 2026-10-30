import { BadInputError } from "@common/domain/errors";
import { Id, normalizeUppercaseText } from "@common/domain/value-objects";

export class TipoActivo {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private codigo: string,
    private descripcion: string | undefined,
    private activo: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(
    nombre: string,
    codigo: string,
    descripcion?: string,
    activo: boolean = true,
  ): TipoActivo {
    const now = new Date();
    return new TipoActivo(
      new Id(),
      normalizeUppercaseText(nombre),
      normalizeUppercaseText(codigo),
      descripcion,
      activo,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    nombre: string,
    codigo: string,
    createdAt: Date,
    updatedAt: Date,
    descripcion?: string,
    activo?: boolean,
  ): TipoActivo {
    return new TipoActivo(
      new Id(id),
      nombre,
      codigo,
      descripcion,
      activo ?? true,
      createdAt,
      updatedAt,
    );
  }

  deactivate(): void {
    if (!this.activo) {
      throw new BadInputError('El tipo de activo ya se encuentra desactivado.');
    }
    this.activo = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    if (this.activo) {
      throw new BadInputError('El tipo de activo ya se encuentra activo.');
    }
    this.activo = true;
    this.updatedAt = new Date();
  }

  update(data: { nombre?: string; codigo?: string; descripcion?: string }): void {
    if (data.nombre !== undefined) this.nombre = normalizeUppercaseText(data.nombre);
    if (data.codigo !== undefined) this.codigo = normalizeUppercaseText(data.codigo);
    if (data.descripcion !== undefined) this.descripcion = data.descripcion;
    this.updatedAt = new Date();
  }

  get getId(): Id { return this.id; }
  get getNombre(): string { return this.nombre; }
  get getCodigo(): string { return this.codigo; }
  get getDescripcion(): string | undefined { return this.descripcion; }
  get getActivo(): boolean { return this.activo; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
