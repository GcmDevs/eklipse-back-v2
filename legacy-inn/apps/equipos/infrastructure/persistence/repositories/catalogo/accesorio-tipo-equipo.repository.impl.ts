import {
  applyActivoStatusToQb,
  TypeOrmTransactionContext,
} from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { AccesorioTipoEquipo } from '@equipos/domain/entities/catalogo/accesorio-tipo-equipo.entity';
import { AccesorioTipoEquipoRead } from '@equipos/domain/read';
import { AccesorioTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/accesorio-tipo-equipo.repository';
import { AccesorioTipoEquipoMapper } from '@equipos/infrastructure/mappers/catalogo/accesorio-tipo-equipo.mapper';
import { Injectable } from '@nestjs/common';
import { AccesorioTipoEquipoOrm } from '@orm/inn/equipos/catalogo/accesorio-tipo-equipo.orm';

@Injectable()
export class TypeOrmAccesorioTipoEquipoRepository
  extends BaseSource
  implements AccesorioTipoEquipoRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(AccesorioTipoEquipoOrm)
      : this.conn.getRepository(AccesorioTipoEquipoOrm);
  }

  private qbBase(alias = 'ate') {
    return this.repository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.parte`, 'parte')
      .leftJoinAndSelect(`${alias}.marca`, 'marca');
  }

  async save(domain: AccesorioTipoEquipo): Promise<AccesorioTipoEquipo> {
    const orm = AccesorioTipoEquipoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return AccesorioTipoEquipoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<AccesorioTipoEquipo | null> {
    const orm = await this.qbBase()
      .leftJoin('ate.tipoEquipo', 'tipoEquipo')
      .addSelect(['tipoEquipo.id'])
      .where('ate.id = :id', { id })
      .getOne();
    return AccesorioTipoEquipoMapper.toDomain(orm);
  }

  async findByTipoEquipoId(tipoEquipoId: number): Promise<AccesorioTipoEquipoRead[]> {
    const qb = this.qbBase()
      .where('ate.tipoEquipo = :tipoEquipoId', { tipoEquipoId })
      .orderBy('ate.id', 'ASC');
    applyActivoStatusToQb(qb, 'ate.activo');
    const orms = await qb.getMany();
    return AccesorioTipoEquipoMapper.toViewList(orms);
  }

  async update(domain: AccesorioTipoEquipo): Promise<AccesorioTipoEquipo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[AccesorioTipoEquipoRead[], number]> {
    const qb = this.qbBase()
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('ate.id', 'ASC');
    applyActivoStatusToQb(qb, 'ate.activo');
    const [orms, count] = await qb.getManyAndCount();
    return [AccesorioTipoEquipoMapper.toViewList(orms), count];
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findViewById(id: number): Promise<AccesorioTipoEquipoRead | null> {
    const orm = await this.qbBase().where('ate.id = :id', { id }).getOne();
    return orm ? AccesorioTipoEquipoMapper.toView(orm) : null;
  }

  async findAllAndCount(page: number, limit: number): Promise<[AccesorioTipoEquipoRead[], number]> {
    return this.findAllView(page, limit);
  }
}
