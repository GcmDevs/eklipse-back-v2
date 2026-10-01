import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import {
  ClasificacionUso,
  EstadoVehiculo,
  TipoActivo,
  TipoCombustible,
  UnidadMedidaCombustible,
} from '../enums';
import {
  validateAnioModelo,
  validateCamposRequeridosPorTipo,
  validateCapacidadCombustible,
  validateKilometraje,
} from '../policies';

export class Vehiculo {
  private constructor(
    private readonly id: Id,
    private placa: string,
    private modeloId: Id,
    private estado: EstadoVehiculo,
    private tipoActivo: TipoActivo,
    private tipoCombustible: TipoCombustible,
    private capacidadAlmacenamientoCombustible: number | null,
    private unidadMedidaCapacidad: UnidadMedidaCombustible,
    private kilometrajeActual: number | null,
    private anioModelo: number | null,
    private clasificacionUso: ClasificacionUso | null,
    private deleted: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    placa: string,
    modeloId: number,
    estado: EstadoVehiculo,
    tipoActivo: TipoActivo,
    tipoCombustible: TipoCombustible,
    capacidadAlmacenamientoCombustible: number | null,
    unidadMedidaCapacidad: UnidadMedidaCombustible,
    kilometrajeActual: number | null,
    anioModelo: number | null,
    clasificacionUso: ClasificacionUso | null
  ): Vehiculo {
    if (!placa || placa.trim().length === 0) {
      throw new BadInputError('La placa del vehículo es requerida');
    }
    validateCapacidadCombustible(capacidadAlmacenamientoCombustible);
    validateKilometraje(kilometrajeActual);
    validateAnioModelo(anioModelo);
    validateCamposRequeridosPorTipo(tipoActivo, { anioModelo, clasificacionUso });

    const now = new Date();
    return new Vehiculo(
      new Id(),
      normalizeUppercaseText(placa),
      new Id(modeloId),
      estado,
      tipoActivo,
      tipoCombustible,
      capacidadAlmacenamientoCombustible,
      unidadMedidaCapacidad,
      kilometrajeActual,
      anioModelo,
      clasificacionUso,
      false,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    placa: string,
    modeloId: number,
    estado: EstadoVehiculo,
    tipoActivo: TipoActivo,
    tipoCombustible: TipoCombustible,
    capacidadAlmacenamientoCombustible: number | null,
    unidadMedidaCapacidad: UnidadMedidaCombustible,
    kilometrajeActual: number | null,
    anioModelo: number | null,
    clasificacionUso: ClasificacionUso | null,
    deleted: boolean,
    createdAt: Date,
    updatedAt: Date
  ): Vehiculo {
    return new Vehiculo(
      new Id(id),
      placa,
      new Id(modeloId),
      estado,
      tipoActivo,
      tipoCombustible,
      capacidadAlmacenamientoCombustible,
      unidadMedidaCapacidad,
      kilometrajeActual,
      anioModelo,
      clasificacionUso,
      deleted,
      createdAt,
      updatedAt
    );
  }

  update(data: {
    modeloId?: number;
    estado?: EstadoVehiculo;
    tipoActivo?: TipoActivo;
    tipoCombustible?: TipoCombustible;
    capacidadAlmacenamientoCombustible?: number | null;
    unidadMedidaCapacidad?: UnidadMedidaCombustible;
    anioModelo?: number | null;
    clasificacionUso?: ClasificacionUso | null;
  }) {
    validateCapacidadCombustible(data.capacidadAlmacenamientoCombustible);
    validateAnioModelo(data.anioModelo);

    const tipoActivo = data.tipoActivo ?? this.tipoActivo;
    const anioModelo = data.anioModelo !== undefined ? data.anioModelo : this.anioModelo;
    const clasificacionUso =
      data.clasificacionUso !== undefined ? data.clasificacionUso : this.clasificacionUso;
    validateCamposRequeridosPorTipo(tipoActivo, { anioModelo, clasificacionUso });

    if (data.modeloId !== undefined) {
      this.modeloId = new Id(data.modeloId);
    }

    if (data.estado !== undefined) {
      this.estado = data.estado;
    }

    if (data.tipoActivo !== undefined) {
      this.tipoActivo = data.tipoActivo;
    }

    if (data.tipoCombustible !== undefined) {
      this.tipoCombustible = data.tipoCombustible;
    }

    if (data.capacidadAlmacenamientoCombustible !== undefined) {
      this.capacidadAlmacenamientoCombustible = data.capacidadAlmacenamientoCombustible;
    }

    if (data.unidadMedidaCapacidad !== undefined) {
      this.unidadMedidaCapacidad = data.unidadMedidaCapacidad;
    }

    if (data.anioModelo !== undefined) {
      this.anioModelo = data.anioModelo;
    }

    if (data.clasificacionUso !== undefined) {
      this.clasificacionUso = data.clasificacionUso;
    }

    this.updatedAt = new Date();
  }

  updateKilometraje(nuevoKilometraje: number): void {
    if (nuevoKilometraje < 0) {
      throw new BadInputError('El kilometraje no puede ser negativo');
    }

    if (this.kilometrajeActual !== null && nuevoKilometraje <= this.kilometrajeActual) {
      throw new BadInputError('El nuevo kilometraje debe ser mayor al actual');
    }

    this.kilometrajeActual = nuevoKilometraje;
    this.updatedAt = new Date();
  }

  replaceKilometrajeActual(valor: number | null): void {
    this.kilometrajeActual = valor;
    this.updatedAt = new Date();
  }

  changeEstado(nuevoEstado: EstadoVehiculo): void {
    this.estado = nuevoEstado;
    this.updatedAt = new Date();
  }

  changeModelo(modeloId: number): void {
    this.modeloId = new Id(modeloId);
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.deleted = true;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.deleted = false;
    this.updatedAt = new Date();
  }

  get getId(): Id {
    return this.id;
  }

  get getPlaca(): string {
    return this.placa;
  }

  get getModeloId(): Id {
    return this.modeloId;
  }

  get getEstado(): EstadoVehiculo {
    return this.estado;
  }

  get getTipoActivo(): TipoActivo {
    return this.tipoActivo;
  }

  get getTipoCombustible(): TipoCombustible {
    return this.tipoCombustible;
  }

  get getCapacidadAlmacenamientoCombustible(): number | null {
    return this.capacidadAlmacenamientoCombustible;
  }

  get getUnidadMedidaCapacidad(): UnidadMedidaCombustible {
    return this.unidadMedidaCapacidad;
  }

  get getKilometrajeActual(): number | null {
    return this.kilometrajeActual;
  }

  get getAnioModelo(): number | null {
    return this.anioModelo;
  }

  get getClasificacionUso(): ClasificacionUso | null {
    return this.clasificacionUso;
  }

  get getDeleted(): boolean {
    return this.deleted;
  }

  get getCreatedAt(): Date {
    return this.createdAt;
  }

  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
