import { Id, normalizeUppercaseText } from "@common/domain/value-objects";
import { FichaTecnicaTipoEquipo } from "@equipos/domain/value-objects";

export class TipoEquipo {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private modeloId: Id,
    private subclaseId: Id,
    private tipoActivoId: Id,
    private observaciones: string | undefined,
    private activo: boolean,
    private fichaTecnica: FichaTecnicaTipoEquipo | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) { }

  static create(
    nombre: string,
    modeloId: number,
    subclaseId: number,
    tipoActivoId: number,
    observaciones?: string,
    fichaTecnica?: FichaTecnicaTipoEquipo,
  ): TipoEquipo {
    const now = new Date();
    return new TipoEquipo(
      new Id(), normalizeUppercaseText(nombre), new Id(modeloId), new Id(subclaseId), new Id(tipoActivoId),
      observaciones, true, fichaTecnica, now, now,
    );
  }

  static rebuild(
    id: number,
    nombre: string,
    modeloId: number,
    subclaseId: number,
    tipoActivoId: number,
    createdAt: Date,
    updatedAt: Date,
    observaciones?: string,
    activo?: boolean,
    fichaTecnica?: FichaTecnicaTipoEquipo,
  ): TipoEquipo {
    return new TipoEquipo(
      new Id(id), nombre, new Id(modeloId), new Id(subclaseId), new Id(tipoActivoId),
      observaciones, activo ?? true, fichaTecnica, createdAt, updatedAt,
    );
  }

  replaceState(
    nombre: string,
    modeloId: number,
    subclaseId: number,
    tipoActivoId: number,
    observaciones: string | undefined,
    fichaTecnica: FichaTecnicaTipoEquipo,
  ): void {
    this.nombre = normalizeUppercaseText(nombre);
    this.modeloId = new Id(modeloId);
    this.subclaseId = new Id(subclaseId);
    this.tipoActivoId = new Id(tipoActivoId);
    this.observaciones = observaciones;
    this.fichaTecnica = fichaTecnica;
    this.updatedAt = new Date();
  }

  modifyBasic(data: { nombre?: string; observaciones?: string | null; }): void {
    if (data.nombre !== undefined) this.nombre = normalizeUppercaseText(data.nombre);
    if (data.observaciones !== undefined) this.observaciones = data.observaciones ?? undefined;
    this.updatedAt = new Date();
  }

  replaceFichaTecnica(fichaTecnica: FichaTecnicaTipoEquipo): void {
    this.fichaTecnica = fichaTecnica;
    this.updatedAt = new Date();
  }

  desactivar(): void {
    this.activo = false;
    this.updatedAt = new Date();
  }

  get getId(): Id { return this.id; }
  get getNombre(): string { return this.nombre; }
  get getModeloId(): Id { return this.modeloId; }
  get getSubclaseId(): Id { return this.subclaseId; }
  get getTipoActivoId(): Id { return this.tipoActivoId; }
  get getObservaciones(): string | undefined { return this.observaciones; }
  get getActivo(): boolean { return this.activo; }
  get getFichaTecnica(): FichaTecnicaTipoEquipo | undefined { return this.fichaTecnica; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
