import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { Compra } from '@equipos/domain/entities/compra.entity';
import { CompraRead } from '@equipos/domain/read';
import { ICompraRepository } from '@equipos/domain/repositories/compra.repository';
import { CompraMapper } from '@equipos/infrastructure/mappers/catalogo/compra.mapper';
import { Injectable } from '@nestjs/common';
import { CompraOrm } from '@orm/inn/equipos/adquisicion/compra.orm';

@Injectable()
export class TypeOrmCompraRepository extends BaseSource implements ICompraRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(CompraOrm) : this.conn.getRepository(CompraOrm);
  }

  private qbBase(alias = 'c') {
    return this.repository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.proveedor`, 'proveedor')
      .leftJoinAndSelect(`${alias}.fabricante`, 'fabricante')
      .leftJoinAndSelect(`${alias}.documentos`, 'documentos')
      .leftJoinAndSelect(`${alias}.distribuidor`, 'distribuidor');
  }

  async save(domain: Compra): Promise<Compra> {
    const orm = CompraMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return CompraMapper.toDomain(saved);
  }

  async findById(id: number): Promise<Compra | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['proveedor', 'fabricante', 'distribuidor'],
    });
    return orm ? CompraMapper.toDomain(orm) : null;
  }

  async update(domain: Compra): Promise<Compra> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[CompraRead[], number]> {
    const [orms, count] = await this.repository.findAndCount({
      relations: ['proveedor', 'fabricante', 'distribuidor'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return [CompraMapper.toViewList(orms), count];
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findViewById(id: number): Promise<CompraRead | null> {
    const orm = await this.qbBase().where('c.id = :id', { id }).getOne();
    return orm ? CompraMapper.toView(orm) : null;
  }

  async findAllAndCount(
    page: number,
    limit: number,
    search?: string
  ): Promise<[CompraRead[], number]> {
    const qb = this.qbBase();
    if (search?.trim()) {
      qb.andWhere('(c.codigo LIKE :search OR proveedor.nombre LIKE :search)', {
        search: `%${search.trim()}%`,
      });
    }
    const [orms, count] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('c.fechaCompra', 'DESC')
      .getManyAndCount();
    return [CompraMapper.toViewList(orms), count];
  }
}
