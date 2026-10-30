import { BaseRepository } from '@common/domain/repositories';
import { PlanDefaultTipoEquipo } from '@inn/activos/identificacion/domain/entities/catalogo/plan-default-tipo-equipo.entity';
import { PlanDefaultTipoEquipoRead } from '@inn/activos/identificacion/domain/read';

export interface PlanDefaultTipoEquipoFindAllFilters {
  tipoEquipoId: number;
  search?: string;
  limit?: number;
}

export interface PlanDefaultTipoEquipoRepository extends BaseRepository<PlanDefaultTipoEquipo, PlanDefaultTipoEquipoRead> {
  findAll(filters: PlanDefaultTipoEquipoFindAllFilters): Promise<PlanDefaultTipoEquipoRead[]>;
}
