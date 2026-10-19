import { BaseRepository } from '@common/domain/repositories';
import { TipoActivo } from '@equipos/domain/entities/catalogo/tipo-activo.entity';
import { TipoActivoRead } from '@equipos/domain/read';

export interface TipoActivoFindAllFilters {
  search?: string;
  limit?: number;
}

export interface TipoActivoRepository extends BaseRepository<TipoActivo, TipoActivoRead> {
  findByCodigo(codigo: string): Promise<TipoActivo | null>;
  findActivos(): Promise<TipoActivoRead[]>;
  findAll(filters: TipoActivoFindAllFilters): Promise<TipoActivoRead[]>;
}
