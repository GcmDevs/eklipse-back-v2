import { EntityStatusQuery } from '@common/domain/types';
import { applyActivoStatusToQb, leftJoinAndSelectWithActivoStatus, TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TipoEquipo } from '@equipos/domain/entities/catalogo/tipo-equipo.entity';
import { TipoEquipoRead } from '@equipos/domain/read';
import { TipoEquipoRepository } from '@equipos/domain/repositories/catalogo/tipo-equipo.repository';
import { TipoEquipoMapper } from '@equipos/infrastructure/mappers/catalogo/tipo-equipo.mapper';
import { Injectable } from '@nestjs/common';
import { TipoEquipoOrm } from '@orm/inn/equipos/catalogo/tipo-equipo.orm';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class TypeOrmTipoEquipoRepository extends BaseSource implements TipoEquipoRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(TipoEquipoOrm) : this.conn.getRepository(TipoEquipoOrm);
  }

  private qbBase(
    alias = 'te',
    estadoHijos?: EntityStatusQuery['estadoHijos'],
  ): SelectQueryBuilder<TipoEquipoOrm> {
    let qb = this.repository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.modelo`, 'modelo')
      .leftJoinAndSelect(`${alias}.subclase`, 'subclase')
      .leftJoinAndSelect(`${alias}.tipoActivo`, 'tipoActivo')
      .leftJoinAndSelect(`modelo.marca`, 'marca');
    qb = leftJoinAndSelectWithActivoStatus(qb, `${alias}.documentos`, 'documentos', estadoHijos);
    qb = leftJoinAndSelectWithActivoStatus(qb, `${alias}.accesoriosEstandar`, 'accesoriosEstandar', estadoHijos);
    qb = leftJoinAndSelectWithActivoStatus(qb, `${alias}.planesDefault`, 'planesDefault', estadoHijos);

    return qb
      .leftJoinAndSelect('documentos.tipoDocumento', 'docTipDoc')
      .leftJoinAndSelect('documentos.archivo', 'docArchivo')
      .leftJoinAndSelect('accesoriosEstandar.parte', 'accParte')
      .leftJoinAndSelect('accesoriosEstandar.marca', 'accMarca')
      .leftJoinAndSelect('planesDefault.formato', 'planFormato');
  }

  async save(domain: TipoEquipo): Promise<TipoEquipo> {
    const orm = TipoEquipoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return TipoEquipoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<TipoEquipo | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['modelo', 'subclase', 'tipoActivo'],
    });
    return orm ? TipoEquipoMapper.toDomain(orm) : null;
  }

  async update(domain: TipoEquipo): Promise<TipoEquipo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[TipoEquipoRead[], number]> {
    throw new Error('mETHOD NO IMPLEMENTED')
  }

  async delete(id: number): Promise<void> {
    throw Error('Method not implemented')
  }

  async findViewById(
    id: number,
    filters?: EntityStatusQuery,
  ): Promise<TipoEquipoRead | null> {
    const qb = this.qbBase('te', filters?.estadoHijos).where('te.id = :id', { id });
    applyActivoStatusToQb(qb, 'te.activo', filters?.estado, 'tipoEquipoEstado');
    const orm = await qb.getOne();
    return orm ? TipoEquipoMapper.toView(orm) : null;
  }

  async findAllAndCount(
    page: number,
    limit: number,
    filters: EntityStatusQuery & { modeloId?: number; subclaseId?: number },
    search?: string,
  ): Promise<[TipoEquipoRead[], number]> {
    const qb = this.qbBase('te', filters?.estadoHijos);
    applyActivoStatusToQb(qb, 'te.activo', filters?.estado, 'tipoEquipoEstado');

    if (filters?.modeloId) {
      qb.andWhere('te.modelo = :modeloId', { modeloId: filters.modeloId })
    }
    if (filters?.subclaseId) {
      qb.andWhere('te.subclase = :subclaseId', { subclaseId: filters.subclaseId })
    }
    if (search?.trim()) {
      qb.andWhere('te.nombre LIKE :search', { search: `%${search.trim()}%` });
    }
    const [orms, count] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('te.createdAt', 'DESC')
      .getManyAndCount();
    return [TipoEquipoMapper.toViewList(orms), count];
  }
}
