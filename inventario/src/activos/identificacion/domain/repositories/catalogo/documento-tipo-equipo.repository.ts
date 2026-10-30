import { BaseRepository } from '@common/domain/repositories';
import { DocumentoTipoEquipo } from '@inn/activos/identificacion/domain/entities/catalogo/documento-tipo-equipo.entity';
import { DocumentoTipoEquipoRead } from '@inn/activos/identificacion/domain/read';

export interface DocumentoTipoEquipoRepository extends BaseRepository<DocumentoTipoEquipo, DocumentoTipoEquipoRead> {
  findByTipoEquipoId(tipoEquipoId: number): Promise<DocumentoTipoEquipoRead[]>;
  findByCompraId(compraId: number): Promise<DocumentoTipoEquipoRead[]>;
}