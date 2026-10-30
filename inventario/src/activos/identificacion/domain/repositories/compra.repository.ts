import { BaseRepository } from '@common/domain/repositories';
import { Compra } from '@inn/activos/identificacion/domain/entities/compra.entity';
import { CompraRead } from '@inn/activos/identificacion/domain/read';

export interface ICompraRepository extends BaseRepository<Compra, CompraRead> {
  findAllAndCount(page: number, limit: number, search?: string): Promise<[CompraRead[], number]>;
}