import {
  TRANSACTION_MANAGER,
  TransactionManager,
  hasDefinedValues,
} from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions, GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import { EstacionServicio } from '@vehiculos/domain/entities';
import {
  ESTACION_SERVICIO_REPOSITORY,
  EstacionServicioFilters,
  EstacionServicioRepository,
} from '@vehiculos/domain/repositories';
import { EstacionServicioRead } from '@vehiculos/domain/reads';
import { CoordenadasGPS } from '@vehiculos/domain/value-objects';
import {
  CreateEstacionServicioDto,
  UpdateEstacionServicioDto,
} from '@vehiculos/presentation/dto/estacion-servicio.dto';

@Injectable()
export class EstacionesServicioService {
  constructor(
    @Inject(ESTACION_SERVICIO_REPOSITORY)
    private readonly estacionRepository: EstacionServicioRepository,

    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async create(data: CreateEstacionServicioDto): Promise<EstacionServicioRead> {
    const ubicacion =
      data.latitud !== undefined && data.longitud !== undefined
        ? CoordenadasGPS.create(data.latitud, data.longitud)
        : null;

    const estacion = EstacionServicio.create(
      data.nombre,
      data.direccion,
      data.observaciones,
      data.municipioId,
      ubicacion
    );

    const estacionSaved = await this.txManager.transactionalOn(
      switchConn(GCM_CONTEXTS.EKLIPSE),
      () => this.estacionRepository.save(estacion)
    );

    return await this.estacionRepository.findViewById(estacionSaved.getId.getValor);
  }

  public async update(
    id: number,
    { latitud, longitud, ...updateData }: UpdateEstacionServicioDto
  ): Promise<EstacionServicioRead> {
    if (!hasDefinedValues({ latitud, longitud, ...updateData })) {
      throw new BadInputError('El objeto no puede estar vacio');
    }
    const estacionFound = await this.findById(id, { throwIfNotFound: true });

    let ubicacion: CoordenadasGPS | undefined;
    if (latitud !== undefined || longitud !== undefined) {
      const lat = latitud ?? estacionFound.getUbicacion?.getLatitud;

      const lng = longitud ?? estacionFound.getUbicacion?.getLongitud;

      if (lat == null || lng == null) {
        throw new BadInputError('Debe enviar latitud y longitud para establecer la ubicación.');
      }

      ubicacion = CoordenadasGPS.create(lat, lng);
    }

    estacionFound.update({
      ...updateData,
      ubicacion,
    });

    return await this.txManager.transactionalOn(switchConn(GCM_CONTEXTS.EKLIPSE), async () => {
      const estacionUpdated = await this.estacionRepository.update(estacionFound);

      if (!estacionUpdated) {
        throw new ResourceNotFoundError(
          `No se pudo actualizar la estación de servicio con id: ${id}`
        );
      }

      return await this.estacionRepository.findViewById(estacionUpdated.getId.getValor);
    });
  }

  async getAll(
    page: number,
    limit: number,
    search?: string,
    filters?: EstacionServicioFilters
  ): Promise<[EstacionServicioRead[], number]> {
    return this.estacionRepository.findAllAndCount(page, limit, search, filters);
  }

  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<EstacionServicio | null> {
    const estacionFound = await this.estacionRepository.findById(id);

    if (!estacionFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Estación de servicio con id: ${id} no encontrada`);
    }

    return estacionFound;
  }
}
