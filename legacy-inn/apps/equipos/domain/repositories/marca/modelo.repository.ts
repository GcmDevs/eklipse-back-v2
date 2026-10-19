import { BaseRepository } from '@common/domain/repositories';
import { Modelo } from '@equipos/domain/entities';
import { ModeloRead } from '@equipos/domain/read';

export interface ModeloRepository extends BaseRepository<Modelo, ModeloRead> {
  existByNombre(nombre: string): Promise<boolean>;
  findAllByMarca(marcaId: number, search?: string): Promise<ModeloRead[]>;
  findModeloByLegacyNombre(nombreLegacy: string): Promise<Modelo | null>;
}
