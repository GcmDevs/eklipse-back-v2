import { applyActivoStatusToQb, TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { PlanDefaultTipoEquipo } from '@equipos/domain/entities/catalogo/plan-default-tipo-equipo.entity';
import { PlanDefaultTipoEquipoRead } from '@equipos/domain/read';
import { PlanDefaultTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/plan-default-tipo-equipo.repository';
import { PlanDefaultTipoEquipoMapper } from '@equipos/infrastructure/mappers/catalogo/plan-default-tipo-equipo.mapper';
import { PlanDefaultTipoEquipoOrm } from '@orm/inn/equipos/catalogo/plan-default-tipo-equipo.orm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeOrmPlanDefaultTipoEquipoRepository extends BaseSource implements PlanDefaultTipoEquipoRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(PlanDefaultTipoEquipoOrm) : this.conn.getRepository(PlanDefaultTipoEquipoOrm);
  }

  private qbBase(alias = 'p') {
    return this.repository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.formato`, 'formato');
  }

  async save(domain: PlanDefaultTipoEquipo): Promise<PlanDefaultTipoEquipo> {
    const orm = PlanDefaultTipoEquipoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return PlanDefaultTipoEquipoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<PlanDefaultTipoEquipo | null> {
    const orm = await this.qbBase()
      .where('p.id = :id', { id })
      .leftJoin('p.tipoEquipo', 'tipoEquipo')
      .addSelect(['tipoEquipo.id'])
      .getOne();
    return orm ? PlanDefaultTipoEquipoMapper.toDomain(orm) : null;
  }

  async findAll({ tipoEquipoId, search, limit }: { tipoEquipoId: number; search?: string; limit?: number }): Promise<PlanDefaultTipoEquipoRead[]> {
    const qb = this.qbBase()
      .where('p.tipoEquipo = :tipoEquipoId', { tipoEquipoId });
    applyActivoStatusToQb(qb, 'p.activo');

    if (search?.trim()) {
      qb.andWhere('p.tipo LIKE :search', { search: `%${search.trim()}%` });
    }
    qb.orderBy('p.id', 'ASC');
    if (limit) {
      qb.take(limit);
    }

    const orms = await qb.getMany();
    return PlanDefaultTipoEquipoMapper.toViewList(orms);
  }

  async update(domain: PlanDefaultTipoEquipo): Promise<PlanDefaultTipoEquipo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[PlanDefaultTipoEquipoRead[], number]> {
    const qb = this.qbBase()
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('p.id', 'ASC');
    applyActivoStatusToQb(qb, 'p.activo');
    const [orms, count] = await qb.getManyAndCount();
    return [PlanDefaultTipoEquipoMapper.toViewList(orms), count];
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findViewById(id: number): Promise<PlanDefaultTipoEquipoRead | null> {
    const orm = await this.qbBase()
      .where('p.id = :id', { id })
      .getOne();
    return orm ? PlanDefaultTipoEquipoMapper.toView(orm) : null;
  }

  async findAllAndCount(page: number, limit: number): Promise<[PlanDefaultTipoEquipoRead[], number]> {
    return this.findAllView(page, limit);
  }
}
