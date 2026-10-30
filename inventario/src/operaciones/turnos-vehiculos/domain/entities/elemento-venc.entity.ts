import { Id } from '@common/domain/value-objects';

export class ElementoVencFlota {
  private constructor(
    private readonly id: Id,
    private vehiculoId: Id,
    private itemKey: string,
    private fechaVencimiento: string,
    private actualizadoPorId: Id,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static upsert(
    id: number | undefined,
    vehiculoId: number,
    itemKey: string,
    fechaVencimiento: string,
    actualizadoPorId: number,
    createdAt?: Date,
    updatedAt?: Date,
  ): ElementoVencFlota {
    const now = new Date();
    return new ElementoVencFlota(
      id ? new Id(id) : new Id(),
      new Id(vehiculoId),
      itemKey,
      fechaVencimiento,
      new Id(actualizadoPorId),
      createdAt ?? now,
      updatedAt ?? now,
    );
  }

  static rebuild(
    id: number,
    vehiculoId: number,
    itemKey: string,
    fechaVencimiento: string,
    actualizadoPorId: number,
    createdAt: Date,
    updatedAt: Date,
  ): ElementoVencFlota {
    return new ElementoVencFlota(
      new Id(id),
      new Id(vehiculoId),
      itemKey,
      fechaVencimiento,
      new Id(actualizadoPorId),
      createdAt,
      updatedAt,
    );
  }

  get getId(): Id { return this.id; }
  get getVehiculoId(): Id { return this.vehiculoId; }
  get getItemKey(): string { return this.itemKey; }
  get getFechaVencimiento(): string { return this.fechaVencimiento; }
  get getActualizadoPorId(): Id { return this.actualizadoPorId; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
