import { BaseRepository } from '@common/domain/repositories';
import { TipoDocCategoriaActivo } from '@equipos/domain/entities/catalogo/tipo-doc-categoria-activo.entity';
import { CategoriaDocumento } from '@equipos/domain/enums';
import { TipoDocCategoriaActivoRead } from '@equipos/domain/read';

export interface TipoDocCategoriaActivoFindAllFilters {
  tipoActivoId?: number;
  categoria?: CategoriaDocumento;
  search?: string;
  limit?: number;
}

export interface TipoDocCategoriaActivoRepository extends BaseRepository<TipoDocCategoriaActivo, TipoDocCategoriaActivoRead> {
  findAll(filters: TipoDocCategoriaActivoFindAllFilters): Promise<TipoDocCategoriaActivoRead[]>;
}
