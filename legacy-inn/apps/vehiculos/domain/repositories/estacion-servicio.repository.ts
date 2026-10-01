import { BaseRepository } from '@common/domain/repositories';
import { EstacionServicio } from '../entities';
import { EstacionServicioRead } from '../reads';

export interface EstacionServicioFilters {
  activa?: boolean;
  municipioId?: number;
}

export interface EstacionServicioRepository
  extends BaseRepository<EstacionServicio, EstacionServicioRead> {
  findViewById(id: number): Promise<EstacionServicioRead | null>;
  findAllAndCount(
    page: number,
    limit: number,
    search?: string,
    filters?: EstacionServicioFilters
  ): Promise<[EstacionServicioRead[], number]>;
}
