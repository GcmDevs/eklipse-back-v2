import { BaseRepository } from '@common/domain/repositories';
import { AccesorioTipoEquipo } from '@equipos/domain/entities/catalogo/accesorio-tipo-equipo.entity';
import { AccesorioTipoEquipoRead } from '@equipos/domain/read';

export interface AccesorioTipoEquipoRepository extends BaseRepository<AccesorioTipoEquipo, AccesorioTipoEquipoRead> {
  findByTipoEquipoId(tipoEquipoId: number): Promise<AccesorioTipoEquipoRead[]>;
}
