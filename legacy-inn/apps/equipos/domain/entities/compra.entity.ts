import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { TipoAdquisicion } from '../enums';

export class Compra {
  private constructor(
    private readonly id: Id,
    private codigo: string,
    private numFactura: string | undefined,
    private fechaFactura: Date | undefined,
    private fechaCompra: Date,
    private fechaFabricacion: Date | undefined,
    private tipoAdquisicion: TipoAdquisicion,
    private aplicaGarantia: boolean,
    private fechVencGarantia: Date | undefined,
    private proveedorId: Id,
    private fabricanteId: Id | undefined,
    private distribuidorId: Id | undefined,
    private proveedorSnap: string,
    private fabricanteSnap: string | undefined,
    private distribuidorSnap: string | undefined,
    private observaciones: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    codigo: string,
    fechaCompra: Date,
    tipoAdquisicion: TipoAdquisicion,
    proveedorId: number,
    proveedorSnap: string,
    numFactura?: string,
    fechaFactura?: Date,
    fechaFabricacion?: Date,
    aplicaGarantia?: boolean,
    fechVencGarantia?: Date,
    fabricanteId?: number,
    distribuidorId?: number,
    fabricanteSnap?: string,
    distribuidorSnap?: string,
    observaciones?: string
  ): Compra {
    const now = new Date();
    return new Compra(
      new Id(),
      normalizeUppercaseText(codigo),
      numFactura ? normalizeUppercaseText(numFactura) : undefined,
      fechaFactura,
      fechaCompra,
      fechaFabricacion,
      tipoAdquisicion,
      aplicaGarantia ?? false,
      fechVencGarantia,
      new Id(proveedorId),
      fabricanteId ? new Id(fabricanteId) : undefined,
      distribuidorId ? new Id(distribuidorId) : undefined,
      normalizeUppercaseText(proveedorSnap),
      normalizeUppercaseText(fabricanteSnap ?? proveedorSnap),
      distribuidorSnap ? normalizeUppercaseText(distribuidorSnap) : undefined,
      observaciones,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    codigo: string,
    fechaCompra: Date,
    tipoAdquisicion: TipoAdquisicion,
    proveedorId: number,
    proveedorSnap: string,
    createdAt: Date,
    updatedAt: Date,
    numFactura?: string,
    fechaFactura?: Date,
    fechaFabricacion?: Date,
    aplicaGarantia?: boolean,
    fechVencGarantia?: Date,
    fabricanteId?: number,
    distribuidorId?: number,
    fabricanteSnap?: string,
    distribuidorSnap?: string,
    observaciones?: string
  ): Compra {
    return new Compra(
      new Id(id),
      codigo,
      numFactura,
      fechaFactura,
      fechaCompra,
      fechaFabricacion,
      tipoAdquisicion,
      aplicaGarantia ?? false,
      fechVencGarantia,
      new Id(proveedorId),
      fabricanteId ? new Id(fabricanteId) : undefined,
      distribuidorId ? new Id(distribuidorId) : undefined,
      proveedorSnap,
      fabricanteSnap ?? proveedorSnap,
      distribuidorSnap,
      observaciones,
      createdAt,
      updatedAt
    );
  }

  update(data: {
    fechaCompra?: Date;
    tipoAdquisicion?: TipoAdquisicion;
    numFactura?: string;
    fechaFactura?: Date;
    fechaFabricacion?: Date;
    aplicaGarantia?: boolean;
    fechVencGarantia?: Date;
    proveedorId?: number;
    fabricanteId?: number | null;
    distribuidorId?: number | null;
    proveedorSnap?: string;
    fabricanteSnap?: string;
    distribuidorSnap?: string | null;
    observaciones?: string;
  }): void {
    if (data.fechaCompra !== undefined) this.fechaCompra = data.fechaCompra;
    if (data.tipoAdquisicion !== undefined) this.tipoAdquisicion = data.tipoAdquisicion;
    if (data.numFactura !== undefined) this.numFactura = normalizeUppercaseText(data.numFactura);
    if (data.fechaFactura !== undefined) this.fechaFactura = data.fechaFactura;
    if (data.fechaFabricacion !== undefined) this.fechaFabricacion = data.fechaFabricacion;
    if (data.aplicaGarantia !== undefined) this.aplicaGarantia = data.aplicaGarantia;
    if (data.fechVencGarantia !== undefined) this.fechVencGarantia = data.fechVencGarantia;
    if (data.proveedorId !== undefined) this.proveedorId = new Id(data.proveedorId);
    if (data.fabricanteId !== undefined) {
      this.fabricanteId = data.fabricanteId != null ? new Id(data.fabricanteId) : undefined;
    }
    if (data.distribuidorId !== undefined) {
      this.distribuidorId = data.distribuidorId != null ? new Id(data.distribuidorId) : undefined;
    }
    if (data.proveedorSnap !== undefined)
      this.proveedorSnap = normalizeUppercaseText(data.proveedorSnap);
    if (data.fabricanteSnap !== undefined)
      this.fabricanteSnap = normalizeUppercaseText(data.fabricanteSnap);
    if (data.distribuidorSnap !== undefined) {
      this.distribuidorSnap = data.distribuidorSnap
        ? normalizeUppercaseText(data.distribuidorSnap)
        : undefined;
    }
    if (data.observaciones !== undefined) this.observaciones = data.observaciones;
    this.updatedAt = new Date();
  }

  garantiaVigente(): boolean {
    if (!this.aplicaGarantia || !this.fechVencGarantia) return false;
    return this.fechVencGarantia.getTime() >= Date.now();
  }

  get getId(): Id {
    return this.id;
  }
  get getCodigo(): string {
    return this.codigo;
  }
  get getNumFactura(): string | undefined {
    return this.numFactura;
  }
  get getFechaFactura(): Date | undefined {
    return this.fechaFactura;
  }
  get getFechaCompra(): Date {
    return this.fechaCompra;
  }
  get getFechaFabricacion(): Date | undefined {
    return this.fechaFabricacion;
  }
  get getTipoAdquisicion(): TipoAdquisicion {
    return this.tipoAdquisicion;
  }
  get getAplicaGarantia(): boolean {
    return this.aplicaGarantia;
  }
  get getFechVencGarantia(): Date | undefined {
    return this.fechVencGarantia;
  }
  get getProveedorId(): Id {
    return this.proveedorId;
  }
  get getFabricanteId(): Id | undefined {
    return this.fabricanteId;
  }
  get getDistribuidorId(): Id | undefined {
    return this.distribuidorId;
  }
  get getProveedorSnap(): string {
    return this.proveedorSnap;
  }
  get getFabricanteSnap(): string | undefined {
    return this.fabricanteSnap;
  }
  get getDistribuidorSnap(): string | undefined {
    return this.distribuidorSnap;
  }
  get getObservaciones(): string | undefined {
    return this.observaciones;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
