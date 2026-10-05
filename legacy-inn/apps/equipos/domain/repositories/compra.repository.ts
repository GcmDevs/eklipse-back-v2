import { BaseRepository } from '@common/domain/repositories';
import { Compra } from '@equipos/domain/entities/compra.entity';
import { CompraRead } from '@equipos/domain/read';

export interface ICompraRepository extends BaseRepository<Compra, CompraRead> {
  findAllAndCount(page: number, limit: number, search?: string): Promise<[CompraRead[], number]>;
}
