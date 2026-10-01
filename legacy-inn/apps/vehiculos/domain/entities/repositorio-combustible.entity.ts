import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { TipoCombustible, TipoMovimientoCombustible, UnidadMedidaCombustible } from '../enums';

export class MovimientoCombustible {
  private constructor(
    private readonly id: Id,
    private readonly repositorioId: Id,
    private readonly tipo: TipoMovimientoCombustible,
    private readonly cantidad: number,
    private readonly stockResultante: number,
    private readonly usuarioId: Id,
    private readonly tanqueoId: Id | null,
    private readonly abastecimientoId: Id | null,
    private readonly createdAt: Date
  ) {}

  static create(
    repositorioId: number,
    tipo: TipoMovimientoCombustible,
    cantidad: number,
    stockResultante: number,
    usuarioId: number,
    tanqueoId?: number | null,
    abastecimientoId?: number | null
  ): MovimientoCombustible {
    return new MovimientoCombustible(
      new Id(),
      new Id(repositorioId),
      tipo,
      cantidad,
      stockResultante,
      new Id(usuarioId),
      tanqueoId != null ? new Id(tanqueoId) : null,
      abastecimientoId != null ? new Id(abastecimientoId) : null,
      new Date()
    );
  }

  static rebuild(
    id: number,
    repositorioId: number,
    tipo: TipoMovimientoCombustible,
    cantidad: number,
    stockResultante: number,
    usuarioId: number,
    tanqueoId: number | null,
    abastecimientoId: number | null,
    createdAt: Date
  ): MovimientoCombustible {
    return new MovimientoCombustible(
      new Id(id),
      new Id(repositorioId),
      tipo,
      cantidad,
      stockResultante,
      new Id(usuarioId),
      tanqueoId != null ? new Id(tanqueoId) : null,
      abastecimientoId != null ? new Id(abastecimientoId) : null,
      createdAt
    );
  }

  get getId(): Id {
    return this.id;
  }
  get getRepositorioId(): Id {
    return this.repositorioId;
  }
  get getTipo(): TipoMovimientoCombustible {
    return this.tipo;
  }
  get getCantidad(): number {
    return this.cantidad;
  }
  get getStockResultante(): number {
    return this.stockResultante;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getTanqueoId(): Id | null {
    return this.tanqueoId;
  }
  get getAbastecimientoId(): Id | null {
    return this.abastecimientoId;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
}

export class RepositorioCombustible {
  private movimientosPendientes: MovimientoCombustible[] = [];

  private constructor(
    private readonly id: Id,
    private nombre: string,
    private tipoCombustible: TipoCombustible,
    private unidadMedida: UnidadMedidaCombustible,
    private capacidad: number,
    private stockActual: number,
    private activo: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    nombre: string,
    tipoCombustible: TipoCombustible,
    unidadMedida: UnidadMedidaCombustible,
    capacidad: number,
    stockInicial: number = 0
  ): RepositorioCombustible {
    if (!nombre?.trim()) {
      throw new BadInputError('El nombre del repositorio es requerido');
    }
    if (capacidad <= 0) {
      throw new BadInputError('La capacidad del repositorio debe ser mayor que cero');
    }
    if (stockInicial < 0) {
      throw new BadInputError('El stock inicial no puede ser negativo');
    }
    if (stockInicial > capacidad) {
      throw new BadInputError('El stock inicial no puede superar la capacidad del repositorio');
    }
    const now = new Date();
    return new RepositorioCombustible(
      new Id(),
      normalizeUppercaseText(nombre),
      tipoCombustible,
      unidadMedida,
      capacidad,
      stockInicial,
      true,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    nombre: string,
    tipoCombustible: TipoCombustible,
    unidadMedida: UnidadMedidaCombustible,
    capacidad: number,
    stockActual: number,
    activo: boolean,
    createdAt: Date,
    updatedAt: Date
  ): RepositorioCombustible {
    return new RepositorioCombustible(
      new Id(id),
      nombre,
      tipoCombustible,
      unidadMedida,
      capacidad,
      stockActual,
      activo,
      createdAt,
      updatedAt
    );
  }

  registerEntrada(cantidad: number, usuarioId: number, abastecimientoId: number): void {
    this.assertActivo();
    if (cantidad <= 0) {
      throw new BadInputError('La cantidad de entrada debe ser mayor que cero');
    }
    const nuevoStock = this.stockActual + cantidad;
    if (nuevoStock > this.capacidad) {
      throw new BadInputError(
        `La entrada supera la capacidad del repositorio (${this.capacidad})`
      );
    }
    this.stockActual = nuevoStock;
    this.updatedAt = new Date();
    this.movimientosPendientes.push(
      MovimientoCombustible.create(
        this.id.getValor,
        TipoMovimientoCombustible.ENTRADA,
        cantidad,
        this.stockActual,
        usuarioId,
        null,
        abastecimientoId
      )
    );
  }

  validateTanqueoSupplyCompatibility(
    tipoCombustible: TipoCombustible,
    unidadMedida: UnidadMedidaCombustible,
    cantidad: number
  ): void {
    this.assertActivo();
    if (tipoCombustible !== this.tipoCombustible) {
      throw new BadInputError('El tipo de combustible no coincide con el del repositorio');
    }
    if (unidadMedida !== this.unidadMedida) {
      throw new BadInputError('La unidad de medida no coincide con la del repositorio');
    }
    if (cantidad <= 0) {
      throw new BadInputError('La cantidad de combustible debe ser mayor que cero');
    }
  }

  registerSalida(cantidad: number, usuarioId: number, tanqueoId: number): void {
    this.assertActivo();
    if (cantidad <= 0) {
      throw new BadInputError('La cantidad de salida debe ser mayor que cero');
    }
    if (cantidad > this.stockActual) {
      throw new BadInputError(
        `Stock insuficiente en el repositorio (disponible: ${this.stockActual})`
      );
    }
    this.stockActual -= cantidad;
    this.updatedAt = new Date();
    this.movimientosPendientes.push(
      MovimientoCombustible.create(
        this.id.getValor,
        TipoMovimientoCombustible.SALIDA,
        cantidad,
        this.stockActual,
        usuarioId,
        tanqueoId,
        null
      )
    );
  }

  pullMovimientosPendientes(): MovimientoCombustible[] {
    const pendientes = this.movimientosPendientes;
    this.movimientosPendientes = [];
    return pendientes;
  }

  private assertActivo(): void {
    if (!this.activo) {
      throw new BadInputError('El repositorio de combustible no está activo');
    }
  }

  get getId(): Id {
    return this.id;
  }
  get getNombre(): string {
    return this.nombre;
  }
  get getTipoCombustible(): TipoCombustible {
    return this.tipoCombustible;
  }
  get getUnidadMedida(): UnidadMedidaCombustible {
    return this.unidadMedida;
  }
  get getCapacidad(): number {
    return this.capacidad;
  }
  get getStockActual(): number {
    return this.stockActual;
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
