import { BaseRepository } from '@common/domain/repositories';
import { ClaseEquipo } from '@inn/activos/identificacion/domain/entities/catalogo/clase-equipo.entity';
import { ClaseEquipoRead } from '@inn/activos/identificacion/domain/read';

export interface ClaseEquipoRepository extends BaseRepository<ClaseEquipo, ClaseEquipoRead> {
  findByCodigo(codigo: string): Promise<ClaseEquipo | null>;
  findAll(tipoActivoId: number): Promise<ClaseEquipoRead[]>;
}
