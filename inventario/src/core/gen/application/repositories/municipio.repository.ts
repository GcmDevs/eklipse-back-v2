import { MunicipioOrm } from '@inn/orm/shared-bd';

export interface MunicipioFilters {
  departamentoId?: number;
}

export interface MunicipioRepository {
  findAllAndCount(
    page: number,
    limit: number,
    search?: string,
    filters?: MunicipioFilters
  ): Promise<[MunicipioOrm[], number]>;
}
