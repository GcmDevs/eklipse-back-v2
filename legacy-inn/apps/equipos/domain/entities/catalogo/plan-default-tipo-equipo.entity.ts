import { Id } from '@common/domain/value-objects';

export class PlanDefaultTipoEquipo {
  private constructor(
    private readonly id: Id,
    private tipoEquipoId: Id,
    private tipo: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private periocidadValor?: number,
    private periocidadUnidad?: string,
    private diasAntNotif?: number,
    private realizaExterno?: boolean,
    private formatoId?: number,
    private observaciones?: string,
    private activo: boolean = true
  ) {}

  static create(
    tipoEquipoId: number,
    tipo: string,
    periocidadValor?: number,
    periocidadUnidad?: string,
    diasAntNotif?: number,
    realizaExterno?: boolean,
    formatoId?: number,
    observaciones?: string
  ): PlanDefaultTipoEquipo {
    const now = new Date();
    return new PlanDefaultTipoEquipo(
      new Id(),
      new Id(tipoEquipoId),
      tipo,
      now,
      now,
      periocidadValor,
      periocidadUnidad,
      diasAntNotif,
      realizaExterno,
      formatoId,
      observaciones,
      true
    );
  }

  static rebuild(
    id: number,
    tipoEquipoId: number,
    tipo: string,
    createdAt: Date,
    updatedAt: Date,
    periocidadValor?: number,
    periocidadUnidad?: string,
    diasAntNotif?: number,
    realizaExterno?: boolean,
    formatoId?: number,
    observaciones?: string,
    activo: boolean = true
  ): PlanDefaultTipoEquipo {
    return new PlanDefaultTipoEquipo(
      new Id(id),
      new Id(tipoEquipoId),
      tipo,
      createdAt,
      updatedAt,
      periocidadValor,
      periocidadUnidad,
      diasAntNotif,
      realizaExterno,
      formatoId,
      observaciones,
      activo
    );
  }

  update(data: {
    tipo?: string;
    periocidadValor?: number;
    periocidadUnidad?: string;
    diasAntNotif?: number;
    realizaExterno?: boolean;
    formatoId?: number;
    observaciones?: string;
  }): void {
    if (data.tipo !== undefined) this.tipo = data.tipo;
    if (data.periocidadValor !== undefined) this.periocidadValor = data.periocidadValor;
    if (data.periocidadUnidad !== undefined) this.periocidadUnidad = data.periocidadUnidad;
    if (data.diasAntNotif !== undefined) this.diasAntNotif = data.diasAntNotif;
    if (data.realizaExterno !== undefined) this.realizaExterno = data.realizaExterno;
    if (data.formatoId !== undefined) this.formatoId = data.formatoId;
    if (data.observaciones !== undefined) this.observaciones = data.observaciones;
    this.updatedAt = new Date();
  }

  inactivar(): void {
    this.activo = false;
    this.updatedAt = new Date();
  }

  get getId(): Id {
    return this.id;
  }
  get getTipoEquipoId(): Id {
    return this.tipoEquipoId;
  }
  get getTipo(): string {
    return this.tipo;
  }
  get getPeriocidadValor(): number | undefined {
    return this.periocidadValor;
  }
  get getPeriocidadUnidad(): string | undefined {
    return this.periocidadUnidad;
  }
  get getDiasAntNotif(): number | undefined {
    return this.diasAntNotif;
  }
  get getRealizaExterno(): boolean | undefined {
    return this.realizaExterno;
  }
  get getFormatoId(): number | undefined {
    return this.formatoId;
  }
  get getObservaciones(): string | undefined {
    return this.observaciones;
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
