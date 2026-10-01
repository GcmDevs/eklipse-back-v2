import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TanqueoInconsistencia } from '@vehiculos/domain/entities';
import {
  TanqueoInconsistenciaRead,
  TanqueoInconsistenciasGrupoRead,
} from '@vehiculos/domain/reads';
import {
  TanqueoInconsistenciaFilters,
  TanqueoInconsistenciaRepository,
} from '@vehiculos/domain/repositories';
import { TanqueoInconsistenciaMapper } from '@vehiculos/infrastructure/mappers';
import { SelectQueryBuilder } from 'typeorm';
import { fetchVehiculosById } from '../eklipse-refs';
import { TanqueoInconsistenciaOrm } from '../orm';

export class TypeOrmTanqueoInconsistenciaRepository
  extends BaseSource
  implements TanqueoInconsistenciaRepository
{
  private get repository() {
    return resolveRepository(this.conn, TanqueoInconsistenciaOrm);
  }

  async save(inconsistencia: TanqueoInconsistencia): Promise<TanqueoInconsistencia> {
    const orm = TanqueoInconsistenciaMapper.toOrm(inconsistencia);
    const saved = await this.repository.save(orm);
    return TanqueoInconsistenciaMapper.toDomain(saved);
  }

  async findById(id: number): Promise<TanqueoInconsistencia | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['tanqueo', 'resueltoPorUsuario'],
    });
    return orm ? TanqueoInconsistenciaMapper.toDomain(orm) : null;
  }

  async findViewById(id: number): Promise<TanqueoInconsistenciaRead | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['tanqueo', 'resueltoPorUsuario'],
    });
    return orm ? TanqueoInconsistenciaMapper.toView(orm) : null;
  }

  async findByTanqueoId(tanqueoId: number): Promise<TanqueoInconsistenciaRead[]> {
    const orms = await this.repository.find({
      where: { tanqueo: { id: tanqueoId } },
      relations: ['tanqueo', 'resueltoPorUsuario'],
    });
    return orms.map(TanqueoInconsistenciaMapper.toView);
  }

  async findAllAndCount(
    page: number,
    limit: number,
    filters?: TanqueoInconsistenciaFilters
  ): Promise<[TanqueoInconsistenciaRead[], number]> {
    const qb = this.baseQb();
    this.applyFilters(qb, filters);
    qb.orderBy('inconsistencia.fechaDeteccion', 'DESC');
    qb.take(limit);
    qb.skip((page - 1) * limit);
    const [items, count] = await qb.getManyAndCount();
    return [items.map(TanqueoInconsistenciaMapper.toView), count];
  }

  async findAllGroupedAndCount(
    page: number,
    limit: number,
    filters?: TanqueoInconsistenciaFilters
  ): Promise<[TanqueoInconsistenciasGrupoRead[], number]> {
    const countQb = this.baseQbWithTanqueoDetails();
    this.applyFilters(countQb, filters);
    const countRow = await countQb
      .select('COUNT(DISTINCT tanqueo.id)', 'total')
      .getRawOne<{ total: string }>();
    const total = Number(countRow?.total ?? 0);

    if (total === 0) {
      return [[], 0];
    }

    const idsQb = this.baseQbWithTanqueoDetails();
    this.applyFilters(idsQb, filters);
    const tanqueoRows = await idsQb
      .select('tanqueo.id', 'id')
      .addSelect('MAX(inconsistencia.fechaDeteccion)', 'ultimaDeteccion')
      .groupBy('tanqueo.id')
      .orderBy('ultimaDeteccion', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: number }>();

    const orderedTanqueoIds = tanqueoRows.map(row => Number(row.id));
    if (orderedTanqueoIds.length === 0) {
      return [[], total];
    }

    const itemsQb = this.baseQbWithTanqueoDetails();
    itemsQb.andWhere('tanqueo.id IN (:...orderedTanqueoIds)', { orderedTanqueoIds });
    this.applyFilters(itemsQb, filters);
    itemsQb.orderBy('inconsistencia.fechaDeteccion', 'DESC');
    const orms = await itemsQb.getMany();

    const activos = await fetchVehiculosById(
      this.ekConn,
      orms.map(orm => orm.tanqueo?.activoId)
    );

    return [TanqueoInconsistenciaMapper.toGroupedView(orms, orderedTanqueoIds, activos), total];
  }

  async saveMany(inconsistencias: TanqueoInconsistencia[]): Promise<void> {
    const orms = inconsistencias.map(TanqueoInconsistenciaMapper.toOrm);
    await this.repository.save(orms);
  }

  private baseQb(): SelectQueryBuilder<TanqueoInconsistenciaOrm> {
    return this.repository
      .createQueryBuilder('inconsistencia')
      .leftJoinAndSelect('inconsistencia.tanqueo', 'tanqueo')
      .leftJoinAndSelect('inconsistencia.resueltoPorUsuario', 'resueltoPor');
  }

  private baseQbWithTanqueoDetails(): SelectQueryBuilder<TanqueoInconsistenciaOrm> {
    return this.repository
      .createQueryBuilder('inconsistencia')
      .leftJoinAndSelect('inconsistencia.tanqueo', 'tanqueo')
      .leftJoinAndSelect('tanqueo.usuario', 'usuario')
      .leftJoinAndSelect('inconsistencia.resueltoPorUsuario', 'resueltoPor');
  }

  private applyFilters(
    qb: SelectQueryBuilder<TanqueoInconsistenciaOrm>,
    filters?: TanqueoInconsistenciaFilters
  ): SelectQueryBuilder<TanqueoInconsistenciaOrm> {
    if (filters?.tanqueoId) {
      qb.andWhere('tanqueo.id = :tanqueoId', { tanqueoId: filters.tanqueoId });
    }
    if (filters?.severidad) {
      qb.andWhere('inconsistencia.SEVERIDAD = :severidad', { severidad: filters.severidad });
    }
    if (filters?.contactoRealizado !== undefined) {
      qb.andWhere('inconsistencia.CONTACTOREALIZADO = :contactoRealizado', {
        contactoRealizado: filters.contactoRealizado,
      });
    }
    return qb;
  }
}
