import { BaseRepository } from '@common/domain/repositories';
import { EntityStatusQuery } from '@common/domain/types';
import { TipoEquipo } from '@equipos/domain/entities/catalogo/tipo-equipo.entity';
import { TipoEquipoRead } from '@equipos/domain/read';

export interface TipoEquipoRepository extends BaseRepository<TipoEquipo, TipoEquipoRead> {
  findAllAndCount(
    page: number,
    limit: number,
    filters: EntityStatusQuery & { modeloId?: number; subclaseId?: number },
    search?: string,
  ): Promise<[TipoEquipoRead[], number]>;

  findViewById(
    id: number,
    filters?: EntityStatusQuery,
  ): Promise<TipoEquipoRead | null>;
}
