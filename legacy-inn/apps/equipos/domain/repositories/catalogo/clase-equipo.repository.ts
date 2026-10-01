import { BaseRepository } from '@common/domain/repositories';
import { ClaseEquipo } from '@equipos/domain/entities/catalogo/clase-equipo.entity';
import { ClaseEquipoRead } from '@equipos/domain/read';

export interface ClaseEquipoRepository extends BaseRepository<ClaseEquipo, ClaseEquipoRead> {
  findByCodigo(codigo: string): Promise<ClaseEquipo | null>;
  findAll(tipoActivoId: number): Promise<ClaseEquipoRead[]>;
}
