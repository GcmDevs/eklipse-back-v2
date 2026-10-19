import { Vehiculo } from '@vehiculos/domain/entities';
import { EstadoVehiculo } from '@vehiculos/domain/enums';
import { VehiculoRead } from '@vehiculos/domain/reads';
import {
  VEHICULO_REPOSITORY,
  VehiculoFilters,
  VehiculoRepository,
} from '@vehiculos/domain/repositories';
import { CreateVehiculoDto, UpdateVehiculoDto } from '@vehiculos/presentation';
import {
  TRANSACTION_MANAGER,
  TransactionManager,
  hasDefinedValues,
} from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class VehiculosService {
  constructor(
    @Inject(VEHICULO_REPOSITORY)
    private readonly vehiculoRepository: VehiculoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async create(data: CreateVehiculoDto): Promise<VehiculoRead> {
    const vehiculo = Vehiculo.create(
      data.placa,
      data.modeloId,
      data.estado ?? EstadoVehiculo.ACTIVA,
      data.tipoActivo,
      data.tipoCombustible,
      data.capacidadAlmacenamientoCombustible ?? null,
      data.unidadMedidaCapacidad,
      data.kilometrajeActual ?? null,
      data.anioModelo ?? null,
      data.clasificacionUso ?? null
    );

    const vehiculoSaved = await this.vehiculoRepository.save(vehiculo);
    return await this.vehiculoRepository.findViewById(vehiculoSaved.getId.getValor);
  }

  public async update(
    id: number,
    { modeloId, ...updateData }: UpdateVehiculoDto
  ): Promise<VehiculoRead> {
    if (!hasDefinedValues({ modeloId, ...updateData })) {
      throw new BadInputError('El objeto no puede estar vacio');
    }
    const vehiculoFound = await this.findById(id);
    const modeloUpdate = modeloId === vehiculoFound.getModeloId.getValor ? undefined : modeloId;

    vehiculoFound.update({
      modeloId: modeloUpdate,
      ...updateData,
    });

    return await this.txManager.transactional(async () => {
      const vehiculoUpdated = await this.vehiculoRepository.update(vehiculoFound);

      if (!vehiculoUpdated) {
        throw new ResourceNotFoundError(`No se pudo actualizar el vehículo con id: ${id}`);
      }

      return await this.vehiculoRepository.findViewById(vehiculoUpdated.getId.getValor);
    });
  }

  async getAll(
    page: number,
    limit: number,
    search?: string,
    filters?: VehiculoFilters
  ): Promise<[VehiculoRead[], number]> {
    return this.vehiculoRepository.findAllAndCount(page, limit, search, filters);
  }

  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<Vehiculo | null> {
    const vehiculoFound = await this.vehiculoRepository.findById(id);

    if (!vehiculoFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Vehículo con id: ${id} no encontrado`);
    }

    return vehiculoFound;
  }
}
