import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { EstadoServicioAmbulancia, TipoAmbulanciaFlota } from '../enums';

export class AmbulanciaFlota {
  private constructor(
    private readonly id: Id,
    private vehiculoId: Id,
    private tipoAmbulancia: TipoAmbulanciaFlota,
    private estadoServicio: EstadoServicioAmbulancia,
    private registradoPorId: Id,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(
    vehiculoId: number,
    tipoAmbulancia: TipoAmbulanciaFlota,
    registradoPorId: number,
  ): AmbulanciaFlota {
    const now = new Date();
    return new AmbulanciaFlota(
      new Id(),
      new Id(vehiculoId),
      tipoAmbulancia,
      EstadoServicioAmbulancia.EN_SERVICIO,
      new Id(registradoPorId),
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    vehiculoId: number,
    tipoAmbulancia: TipoAmbulanciaFlota,
    estadoServicio: EstadoServicioAmbulancia,
    registradoPorId: number,
    createdAt: Date,
    updatedAt: Date,
  ): AmbulanciaFlota {
    return new AmbulanciaFlota(
      new Id(id),
      new Id(vehiculoId),
      tipoAmbulancia,
      estadoServicio,
      new Id(registradoPorId),
      createdAt,
      updatedAt,
    );
  }

  marcarFueraServicio(): void {
    this.estadoServicio = EstadoServicioAmbulancia.FUERA_SERVICIO;
    this.updatedAt = new Date();
  }

  marcarEnServicio(): void {
    this.estadoServicio = EstadoServicioAmbulancia.EN_SERVICIO;
    this.updatedAt = new Date();
  }

  assertEnServicio(): void {
    if (this.estadoServicio !== EstadoServicioAmbulancia.EN_SERVICIO) {
      throw new BadInputError('La ambulancia no está en servicio');
    }
  }

  get getId(): Id { return this.id; }
  get getVehiculoId(): Id { return this.vehiculoId; }
  get getTipoAmbulancia(): TipoAmbulanciaFlota { return this.tipoAmbulancia; }
  get getEstadoServicio(): EstadoServicioAmbulancia { return this.estadoServicio; }
  get getRegistradoPorId(): Id { return this.registradoPorId; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
