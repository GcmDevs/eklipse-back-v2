import {
  TRANSACTION_MANAGER,
  TransactionManager,
  hasDefinedValues,
} from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions, GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import { EstacionServicio } from '@inn/operaciones/tanqueos/domain/entities';
import {
  ESTACION_SERVICIO_REPOSITORY,
  EstacionServicioFilters,
  EstacionServicioRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import { EstacionServicioRead } from '@inn/operaciones/tanqueos/domain/reads';
import { CoordenadasGPS } from '@inn/operaciones/tanqueos/domain/value-objects';
import {
  CreateEstacionServicioDto,
  UpdateEstacionServicioDto,
} from '@inn/operaciones/tanqueos/presentation/dto/estacion-servicio.dto';

@Injectable()
export class EstacionesServicioService {
  constructor(
    @Inject(ESTACION_SERVICIO_REPOSITORY)
    private readonly estacionRepository: EstacionServicioRepository,

    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async create(data: CreateEstacionServicioDto): Promise<EstacionServicioRead> {
    const lat = data.ubicacion?.latitud ?? data.latitud;
    const lng = data.ubicacion?.longitud ?? data.longitud;
    const prec = data.ubicacion?.precisionMetros ?? data.precisionMetros ?? null;
    const ubicacion =
      lat !== undefined && lng !== undefined
        ? CoordenadasGPS.create(lat, lng, prec)
        : null;

    const estacion = EstacionServicio.create(
      data.nombre,
      data.direccion,
      data.observaciones,
      data.municipioId,
      ubicacion,
      undefined,
      data.nit
    );

    const estacionSaved = await this.txManager.transactionalOn(
      switchConn(GCM_CONTEXTS.EKLIPSE),
      () => this.estacionRepository.save(estacion)
    );

    return await this.estacionRepository.findViewById(estacionSaved.getId.getValor);
  }

  public async update(
    id: number,
    {
      latitud,
      longitud,
      precisionMetros,
      ubicacion: ubicacionDto,
      ...updateData
    }: UpdateEstacionServicioDto
  ): Promise<EstacionServicioRead> {
    if (
      !hasDefinedValues({
        latitud,
        longitud,
        precisionMetros,
        ubicacion: ubicacionDto,
        ...updateData,
      })
    ) {
      throw new BadInputError('El objeto no puede estar vacio');
    }
    const estacionFound = await this.findById(id, { throwIfNotFound: true });

    let ubicacion: CoordenadasGPS | undefined;
    if (
      ubicacionDto !== undefined ||
      latitud !== undefined ||
      longitud !== undefined ||
      precisionMetros !== undefined
    ) {
      const lat =
        ubicacionDto?.latitud ?? latitud ?? estacionFound.getUbicacion?.getLatitud;
      const lng =
        ubicacionDto?.longitud ?? longitud ?? estacionFound.getUbicacion?.getLongitud;
      const prec =
        ubicacionDto?.precisionMetros ??
        precisionMetros ??
        estacionFound.getUbicacion?.getPrecisionMetros ??
        null;

      if (lat == null || lng == null) {
        throw new BadInputError('Debe enviar latitud y longitud para establecer la ubicación.');
      }

      ubicacion = CoordenadasGPS.create(lat, lng, prec);
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
