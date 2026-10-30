import { BaseRepository } from '@common/domain/repositories';
import { Marca } from '@inn/activos/identificacion/domain/entities';
import { MarcaRead } from '@inn/activos/identificacion/domain/read';

export interface MarcaRepository extends BaseRepository<Marca, MarcaRead> {
  existByNombre(nombre: string): Promise<boolean>;
  findAllAndCount(page: number, take: number, search?: string): Promise<[MarcaRead[], number]>;
  findMarcaByLegacyNombre(nombreLegacy: string): Promise<Marca | null>
}
