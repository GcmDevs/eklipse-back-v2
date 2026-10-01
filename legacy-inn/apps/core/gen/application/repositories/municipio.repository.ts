import { MunicipioOrm } from '@orm/shared-bd';

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
