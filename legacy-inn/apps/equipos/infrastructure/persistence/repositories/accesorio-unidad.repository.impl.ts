import { BaseSource } from '@common/infrastructure/services';
import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { AccesorioUnidad } from '@equipos/domain/entities';
import { EstadoAccesorioUnidad } from '@equipos/domain/enums';
import { AccesorioUnidadRead } from '@equipos/domain/read';
import { IAccesorioUnidadRepository } from '@equipos/domain/repositories/accesorio-unidad.repository';
import { AccesorioUnidadMapper } from '@equipos/infrastructure/mappers/accesorio-unidad.mapper';
import { Injectable } from '@nestjs/common';
import { AccesorioUnidadOrm } from '@orm/inn/equipos';

@Injectable()
export class TypeOrmAccesorioUnidadRepository
  extends BaseSource
  implements IAccesorioUnidadRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(AccesorioUnidadOrm)
      : this.conn.getRepository(AccesorioUnidadOrm);
  }

  private qbBase(alias = 'au') {
    return this.repository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.accesorioEstandar`, 'ae')
      .leftJoinAndSelect('ae.marca', 'marca')
      .leftJoinAndSelect('ae.parte', 'parte');
  }

  async save(domain: AccesorioUnidad): Promise<AccesorioUnidad> {
    const orm = AccesorioUnidadMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return AccesorioUnidadMapper.toDomain(saved);
  }

  async findById(id: number): Promise<AccesorioUnidad | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['equipo', 'accesorioEstandar', 'accesorioEstandar.marca'],
    });
    return orm ? AccesorioUnidadMapper.toDomain(orm) : null;
  }

  async findByEquipoId(equipoId: number): Promise<AccesorioUnidadRead[]> {
    const orms = await this.qbBase()
      .where('au.equipo = :equipoId', { equipoId })
      .orderBy('au.id', 'ASC')
      .getMany();
    return AccesorioUnidadMapper.toViewList(orms);
  }

  async createFromEstandar(
    equipoId: number,
    accesorioEstandarId: number,
    parteSnap: string,
    estado: EstadoAccesorioUnidad = EstadoAccesorioUnidad.ENTREGADO,
    observaciones?: string
  ): Promise<AccesorioUnidad> {
    const entity = AccesorioUnidad.create(
      equipoId,
      accesorioEstandarId,
      parteSnap,
      estado,
      observaciones
    );
    return this.save(entity);
  }

  async findByAccesorioEstandarId(
    accesorioEstandarId: number,
    equipoIds: number[]
  ): Promise<AccesorioUnidad[]> {
    if (!equipoIds.length) return [];
    const orms = await this.qbBase()
      .leftJoinAndSelect('au.equipo', 'eq')
      .where('au.accesorioEstandar = :accesorioEstandarId', { accesorioEstandarId })
      .andWhere('au.equipo IN (:...equipoIds)', { equipoIds })
      .andWhere('au.descontinuado = :descontinuado', { descontinuado: false })
      .getMany();
    return orms.map(orm => AccesorioUnidadMapper.toDomain(orm));
  }

  async findEquipoIdsConAccesorio(
    accesorioEstandarId: number,
    equipoIds: number[]
  ): Promise<number[]> {
    if (!equipoIds.length) return [];
    const founds = await this.repository
      .createQueryBuilder('au')
      .leftJoin('au.equipo', 'eq')
      .select('eq.id', 'equipoId')
      .where('au.accesorioEstandar = :accesorioEstandarId', { accesorioEstandarId })
      .andWhere('au.equipo IN (:...equipoIds)', { equipoIds })
      .andWhere('au.descontinuado = :descontinuado', { descontinuado: false })
      .getRawMany<{ equipoId: number }>();
    return founds.map(row => row.equipoId);
  }

  async findAllView(page: number, limit: number): Promise<[AccesorioUnidadRead[], number]> {
    const [orms, count] = await this.qbBase()
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('au.id', 'ASC')
      .getManyAndCount();
    return [AccesorioUnidadMapper.toViewList(orms), count];
  }

  async findViewById(id: number): Promise<AccesorioUnidadRead | null> {
    const orm = await this.qbBase().where('au.id = :id', { id }).getOne();
    return orm ? AccesorioUnidadMapper.toView(orm) : null;
  }

  async findAllAndCount(page: number, limit: number): Promise<[AccesorioUnidadRead[], number]> {
    return this.findAllView(page, limit);
  }

  async update(domain: AccesorioUnidad): Promise<AccesorioUnidad> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
