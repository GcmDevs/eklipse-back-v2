import { BaseRepository } from '@common/domain/repositories';
import { TipoDocCategoriaActivo } from '@inn/activos/identificacion/domain/entities/catalogo/tipo-doc-categoria-activo.entity';
import { CategoriaDocumento } from '@inn/activos/identificacion/domain/enums';
import { TipoDocCategoriaActivoRead } from '@inn/activos/identificacion/domain/read';

export interface TipoDocCategoriaActivoFindAllFilters {
  tipoActivoId?: number;
  categoria?: CategoriaDocumento;
  search?: string;
  limit?: number;
}

export interface TipoDocCategoriaActivoRepository extends BaseRepository<TipoDocCategoriaActivo, TipoDocCategoriaActivoRead> {
  findAll(filters: TipoDocCategoriaActivoFindAllFilters): Promise<TipoDocCategoriaActivoRead[]>;
}
