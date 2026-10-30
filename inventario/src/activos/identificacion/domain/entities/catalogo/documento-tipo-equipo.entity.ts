import { Id } from "@common/domain/value-objects";

export class DocumentoTipoEquipo {
  private constructor(
    private id: Id,
    private tipoEquipoId: Id | undefined,
    private tipoDocumentoId: number,
    private aplica: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private archivoId?: number,
    private observaciones?: string,
    private activo: boolean = true,
    private compraId?: Id,
  ) {}

  static createForTipoEquipo(
    tipoEquipoId: number,
    tipoDocumentoId: number,
    aplica: boolean,
    archivoId?: number,
    observaciones?: string,
  ): DocumentoTipoEquipo {
    const now = new Date();
    return new DocumentoTipoEquipo(
      new Id(), new Id(tipoEquipoId), tipoDocumentoId, aplica, now, now, archivoId, observaciones, true,
    );
  }

  static createForCompra(
    compraId: number,
    tipoDocumentoId: number,
    aplica: boolean,
    archivoId?: number,
    observaciones?: string,
  ): DocumentoTipoEquipo {
    const now = new Date();
    return new DocumentoTipoEquipo(
      new Id(), undefined, tipoDocumentoId, aplica, now, now, archivoId, observaciones, true, new Id(compraId),
    );
  }

  static rebuild(
    id: number, tipoEquipoId: number | undefined, tipoDocumentoId: number,
    aplica: boolean, createdAt: Date, updatedAt: Date,
    archivoId?: number, observaciones?: string, activo: boolean = true, compraId?: number,
  ): DocumentoTipoEquipo {
    return new DocumentoTipoEquipo(
      new Id(id), tipoEquipoId ? new Id(tipoEquipoId) : undefined, tipoDocumentoId, aplica, createdAt, updatedAt,
      archivoId, observaciones, activo, compraId ? new Id(compraId) : undefined,
    );
  }

  update(data: { tipoDocumentoId?: number; aplica?: boolean; archivoId?: number; observaciones?: string }): void {
    if (data.tipoDocumentoId !== undefined) this.tipoDocumentoId = data.tipoDocumentoId;
    if (data.aplica !== undefined) this.aplica = data.aplica;
    if (data.archivoId !== undefined) this.archivoId = data.archivoId;
    if (data.observaciones !== undefined) this.observaciones = data.observaciones;
    this.updatedAt = new Date();
  }

  depreciate(): void {
    this.activo = false;
    this.updatedAt = new Date();
  }

  get getId(): Id { return this.id; }
  get getTipoEquipoId(): Id | undefined { return this.tipoEquipoId; }
  get getCompraId(): Id | undefined { return this.compraId; }
  get getTipoDocumentoId(): number { return this.tipoDocumentoId; }
  get getAplica(): boolean { return this.aplica; }
  get getArchivoId(): number | undefined { return this.archivoId; }
  get getObservaciones(): string | undefined { return this.observaciones; }
  get getActivo(): boolean { return this.activo; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
