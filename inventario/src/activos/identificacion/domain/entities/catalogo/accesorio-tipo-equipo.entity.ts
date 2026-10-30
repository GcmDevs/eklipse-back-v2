import { Id, normalizeUppercaseText } from '@common/domain/value-objects';

export class AccesorioTipoEquipo {
  private constructor(
    private readonly id: Id,
    private tipoEquipoId: Id,
    private parteId: Id,
    private parteSnap: string,
    private cantidad: number,
    private marcaId?: Id,
    private referencia?: string,
    private observaciones?: string,
    private activo: boolean = true
  ) {}

  static create(
    tipoEquipoId: number,
    parteId: number,
    parteSnap: string,
    cantidad: number,
    marcaId?: number,
    referencia?: string,
    observaciones?: string
  ): AccesorioTipoEquipo {
    return new AccesorioTipoEquipo(
      new Id(),
      new Id(tipoEquipoId),
      new Id(parteId),
      normalizeUppercaseText(parteSnap),
      cantidad,
      marcaId != null ? new Id(marcaId) : undefined,
      referencia ? normalizeUppercaseText(referencia) : undefined,
      observaciones,
      true
    );
  }

  static rebuild(
    id: number,
    tipoEquipoId: number,
    parteId: number,
    parteSnap: string,
    cantidad: number,
    marcaId?: number,
    referencia?: string,
    observaciones?: string,
    activo = true
  ): AccesorioTipoEquipo {
    return new AccesorioTipoEquipo(
      new Id(id),
      new Id(tipoEquipoId),
      new Id(parteId),
      parteSnap,
      cantidad,
      marcaId != null ? new Id(marcaId) : undefined,
      referencia,
      observaciones,
      activo
    );
  }

  update(data: {
    parteId?: number;
    parteSnap?: string;
    cantidad?: number;
    marcaId?: number;
    referencia?: string;
    observaciones?: string;
  }): void {
    if (data.parteId !== undefined) this.parteId = new Id(data.parteId);
    if (data.parteSnap !== undefined) this.parteSnap = normalizeUppercaseText(data.parteSnap);
    if (data.cantidad !== undefined) this.cantidad = data.cantidad;
    if (data.marcaId !== undefined) this.marcaId = new Id(data.marcaId);
    if (data.referencia !== undefined) {
      this.referencia = normalizeUppercaseText(data.referencia);
    }
    if (data.observaciones !== undefined) this.observaciones = data.observaciones;
  }

  deprecar(): void {
    this.activo = false;
  }

  get getId(): Id {
    return this.id;
  }
  get getTipoEquipoId(): Id {
    return this.tipoEquipoId;
  }
  get getParteId(): Id {
    return this.parteId;
  }
  get getParteSnap(): string {
    return this.parteSnap;
  }
  get getCantidad(): number {
    return this.cantidad;
  }
  get getMarcaId(): Id | undefined {
    return this.marcaId;
  }
  get getReferencia(): string | undefined {
    return this.referencia;
  }
  get getObservaciones(): string | undefined {
    return this.observaciones;
  }
  get getActivo(): boolean {
    return this.activo;
  }
}
