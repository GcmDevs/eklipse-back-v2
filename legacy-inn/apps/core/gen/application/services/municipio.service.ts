import { Inject, Injectable } from '@nestjs/common';
import { MunicipioRead } from '@core/gen/presentation/dto';
import { MunicipioMapper } from '@core/gen/infrastructure/mappers';
import { MUNICIPIO_REPOSITORY, MunicipioFilters, MunicipioRepository } from '../repositories';

@Injectable()
export class MunicipioService {
  constructor(
    @Inject(MUNICIPIO_REPOSITORY)
    private readonly municipioRepository: MunicipioRepository
  ) {}

  async getAll(
    page: number,
    limit: number,
    search?: string,
    filters?: MunicipioFilters
  ): Promise<[MunicipioRead[], number]> {
    const [items, count] = await this.municipioRepository.findAllAndCount(
      page,
      limit,
      search,
      filters
    );
    return [items.map(MunicipioMapper.toView), count];
  }
}
