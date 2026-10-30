import { TanqueoEventoLog, Vehiculo } from '@inn/operaciones/tanqueos/domain/entities';
import { EstadoOdometro, EstadoVehiculo } from '@inn/operaciones/tanqueos/domain/enums';
import { VehiculoRead } from '@inn/operaciones/tanqueos/domain/reads';
import {
  LECTURA_ODOMETRO_REPOSITORY,
  LecturaOdometroRepository,
  TANQUEO_EVENTO_LOG_REPOSITORY,
  TanqueoEventoLogRepository,
  VEHICULO_REPOSITORY,
  VehiculoFilters,
  VehiculoRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import { enrichVehiculosReadWithReferencias, enrichVehiculoReadWithReferencia } from '../helpers/vehiculo-odometro-read.helper';
import { CreateVehiculoDto, UpdateVehiculoDto } from '@inn/operaciones/tanqueos/presentation';
import {
  TRANSACTION_MANAGER,
  TransactionManager,
  hasDefinedValues,
} from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { getUser } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class VehiculosService {
  constructor(
    @Inject(VEHICULO_REPOSITORY)
    private readonly vehiculoRepository: VehiculoRepository,
    @Inject(LECTURA_ODOMETRO_REPOSITORY)
    private readonly lecturaOdometroRepository: LecturaOdometroRepository,
    @Inject(TANQUEO_EVENTO_LOG_REPOSITORY)
    private readonly eventoLogRepository: TanqueoEventoLogRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async changeOdometroEstado(
    id: number,
    estado: EstadoOdometro,
    observacion?: string
  ): Promise<VehiculoRead> {
    const vehiculo = await this.findById(id, { throwIfNotFound: true });
    const anterior = vehiculo.getOdometroEstado;
    vehiculo.changeOdometroEstado(estado);
    const usuario = getUser();

    return this.txManager.transactional(async () => {
      await this.vehiculoRepository.update(vehiculo);
      await this.eventoLogRepository.save(
        TanqueoEventoLog.createCambioEstadoOdometro({
          activoId: id,
          usuarioId: usuario.id,
          estadoAnterior: anterior,
          estadoNuevo: estado,
          observacion,
        })
      );
      return this.vehiculoRepository.findViewById(id);
    });
  }

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
    const [items, count] = await this.vehiculoRepository.findAllAndCount(
      page,
      limit,
      search,
      filters
    );
    const referencias = await this.lecturaOdometroRepository.findLatestConfiableReferencias(
      items.map(v => v.id)
    );
    return [enrichVehiculosReadWithReferencias(items, referencias), count];
  }

  async getViewById(id: number, options: FindThrowOptions = new FindThrowOptions()): Promise<VehiculoRead> {
    const view = await this.vehiculoRepository.findViewById(id);
    if (!view && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Vehículo con id: ${id} no encontrado`);
    }
    if (!view) return null as never;
    const referencias = await this.lecturaOdometroRepository.findLatestConfiableReferencias([id]);
    return enrichVehiculoReadWithReferencia(view, referencias.get(id) ?? null);
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
