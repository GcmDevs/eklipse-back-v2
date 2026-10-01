import { BaseRepository } from '@common/domain/repositories';
import { DocumentoTipoEquipo } from '@equipos/domain/entities/catalogo/documento-tipo-equipo.entity';
import { DocumentoTipoEquipoRead } from '@equipos/domain/read';

export interface DocumentoTipoEquipoRepository extends BaseRepository<DocumentoTipoEquipo, DocumentoTipoEquipoRead> {
  findByTipoEquipoId(tipoEquipoId: number): Promise<DocumentoTipoEquipoRead[]>;
  findByCompraId(compraId: number): Promise<DocumentoTipoEquipoRead[]>;
}