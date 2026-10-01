import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { TypeOrmAreaRepository } from '@equipos/infrastructure';
import { Injectable } from '@nestjs/common';
import { AreaServicioOrm } from '@orm/gen';

@Injectable()
export class AreaService {
  constructor(private readonly areaRepository: TypeOrmAreaRepository) {}

  public async getOneById(id: number): Promise<AreaServicioOrm> {
    return await this.findOneById(id);
  }

  public async getSuggestionsByNombre(
    nombreParcial: string,
    limit?: number
  ): Promise<AreaServicioOrm[]> {
    return await this.areaRepository.findSuggestionsByNombre(nombreParcial, limit);
  }

  public async findOneById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<AreaServicioOrm | null> {
    const areaFound = await this.areaRepository.findById(id);
    if (!areaFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Area o dependecia con id: ${id} no encontrada.`);
    }
    return areaFound;
  }
}
