import { BaseRepository } from '@common/domain/repositories';
import { SubclaseEquipo } from '@equipos/domain/entities/catalogo/subclase-equipo.entity';
import { SubclaseEquipoRead } from '@equipos/domain/read';

export interface SubclaseEquipoRepository extends BaseRepository<SubclaseEquipo, SubclaseEquipoRead> {
  findByCodigo(codigo: string): Promise<SubclaseEquipo | null>;
  findAll(claseId: number): Promise<SubclaseEquipoRead[]>;
}
