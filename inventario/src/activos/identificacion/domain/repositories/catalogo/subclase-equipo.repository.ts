import { BaseRepository } from '@common/domain/repositories';
import { SubclaseEquipo } from '@inn/activos/identificacion/domain/entities/catalogo/subclase-equipo.entity';
import { SubclaseEquipoRead } from '@inn/activos/identificacion/domain/read';

export interface SubclaseEquipoRepository extends BaseRepository<SubclaseEquipo, SubclaseEquipoRead> {
  findByCodigo(codigo: string): Promise<SubclaseEquipo | null>;
  findAll(claseId: number): Promise<SubclaseEquipoRead[]>;
}
