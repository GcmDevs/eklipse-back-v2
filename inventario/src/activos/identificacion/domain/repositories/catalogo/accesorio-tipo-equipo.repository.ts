import { BaseRepository } from '@common/domain/repositories';
import { AccesorioTipoEquipo } from '@inn/activos/identificacion/domain/entities/catalogo/accesorio-tipo-equipo.entity';
import { AccesorioTipoEquipoRead } from '@inn/activos/identificacion/domain/read';

export interface AccesorioTipoEquipoRepository extends BaseRepository<AccesorioTipoEquipo, AccesorioTipoEquipoRead> {
  findByTipoEquipoId(tipoEquipoId: number): Promise<AccesorioTipoEquipoRead[]>;
}
