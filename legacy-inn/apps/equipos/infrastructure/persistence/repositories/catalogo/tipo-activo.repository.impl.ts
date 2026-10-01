import { applyActivoStatusToQb, TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TipoActivo } from '@equipos/domain/entities/catalogo/tipo-activo.entity';
import { TipoActivoRead } from '@equipos/domain/read';
import { TipoActivoRepository } from '@equipos/domain/repositories/catalogo/tipo-activo.repository';
import { TipoActivoMapper } from '@equipos/infrastructure/mappers/catalogo/tipo-activo.mapper';
import { TipoActivoOrm } from '@orm/inn/equipos/catalogo/tipo-activo.orm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeOrmTipoActivoRepository extends BaseSource implements TipoActivoRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(TipoActivoOrm) : this.conn.getRepository(TipoActivoOrm);
  }

  async save(domain: TipoActivo): Promise<TipoActivo> {
    const orm = TipoActivoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return TipoActivoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<TipoActivo | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? TipoActivoMapper.toDomain(orm) : null;
  }

  async findActivos(): Promise<TipoActivoRead[]> {
    const qb = this.repository.createQueryBuilder('tipoActivo')
      .orderBy('tipoActivo.nombre', 'ASC');
    applyActivoStatusToQb(qb, 'tipoActivo.activo');
    const orms = await qb.getMany();
    return TipoActivoMapper.toViewList(orms);
  }

  async findAll({ search, limit }: { search?: string; limit?: number }): Promise<TipoActivoRead[]> {
    const qb = this.repository.createQueryBuilder('tipoActivo')
      .orderBy('tipoActivo.nombre', 'ASC');
    applyActivoStatusToQb(qb, 'tipoActivo.activo');

    if (search?.trim()) {
      qb.andWhere('tipoActivo.nombre LIKE :search', { search: `%${search.trim()}%` });
    }
    if (limit) {
      qb.take(limit);
    }

    const orms = await qb.getMany();
    return TipoActivoMapper.toViewList(orms);
  }

  async findByCodigo(codigo: string): Promise<TipoActivo | null> {
    const orm = await this.repository.findOne({ where: { codigo } });
    return orm ? TipoActivoMapper.toDomain(orm) : null;
  }

  async update(domain: TipoActivo): Promise<TipoActivo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[TipoActivoRead[], number]> {
    const [orms, count] = await this.repository.findAndCount({ skip: (page - 1) * limit, take: limit, order: { nombre: 'ASC' } });
    return [TipoActivoMapper.toViewList(orms), count];
  }

  async delete(id: number): Promise<void> {
  }

  async findViewById(id: number): Promise<TipoActivoRead | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? TipoActivoMapper.toView(orm) : null;
  }

  async findAllAndCount(page: number, limit: number): Promise<[TipoActivoRead[], number]> {
    const [orms, count] = await this.repository.findAndCount({ skip: (page - 1) * limit, take: limit });
    return [TipoActivoMapper.toViewList(orms), count];
  }
}
