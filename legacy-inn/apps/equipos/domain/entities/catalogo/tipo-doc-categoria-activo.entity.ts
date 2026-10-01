import { BadInputError } from "@common/domain/errors";
import { Id, normalizeUppercaseText } from "@common/domain/value-objects";
import { CategoriaDocumento } from "@equipos/domain/enums";
import { ReglasObligatoriedadTipoActivo } from "@equipos/domain/value-objects";

export class TipoDocCategoriaActivo {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private categoria: CategoriaDocumento,
    private reglasTipoActivo: ReglasObligatoriedadTipoActivo,
    private descripcion: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(
    nombre: string,
    categoria: CategoriaDocumento,
    reglasTipoActivo: ReglasObligatoriedadTipoActivo,
    descripcion?: string,
  ): TipoDocCategoriaActivo {
    const now = new Date();
    return new TipoDocCategoriaActivo(
      new Id(),
      normalizeUppercaseText(nombre),
      categoria,
      reglasTipoActivo,
      descripcion,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    nombre: string,
    categoria: CategoriaDocumento,
    reglasTipoActivo: ReglasObligatoriedadTipoActivo,
    createdAt: Date,
    updatedAt: Date,
    descripcion?: string,
  ): TipoDocCategoriaActivo {
    return new TipoDocCategoriaActivo(
      new Id(id),
      nombre,
      categoria,
      reglasTipoActivo,
      descripcion,
      createdAt,
      updatedAt,
    );
  }

  replaceState(
    nombre: string,
    categoria: CategoriaDocumento,
    reglasTipoActivo: ReglasObligatoriedadTipoActivo,
    descripcion?: string,
  ): void {
    this.nombre = normalizeUppercaseText(nombre);
    this.categoria = categoria;
    this.reglasTipoActivo = reglasTipoActivo;
    this.descripcion = descripcion;
    this.updatedAt = new Date();
  }

  IsObligatorioPara(tipoActivoId: number): boolean {
    const valor = this.reglasTipoActivo.getEsObligatorioPara(tipoActivoId);
    if (valor === undefined) {
      throw new BadInputError(
        `El tipo de documento no aplica para el tipo de activo con id ${tipoActivoId}.`,
      );
    }
    return valor;
  }

  AppliesToTipoActivo(tipoActivoId: number): boolean {
    return this.reglasTipoActivo.aplicaParaTipoActivo(tipoActivoId);
  }

  get getId(): Id { return this.id; }
  get getNombre(): string { return this.nombre; }
  get getCategoria(): CategoriaDocumento { return this.categoria; }
  get getReglasTipoActivo(): ReglasObligatoriedadTipoActivo { return this.reglasTipoActivo; }
  get getDescripcion(): string | undefined { return this.descripcion; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
