import { BaseSource } from '@common/infrastructure/services';
import { EstacionServicio } from '@vehiculos/domain/entities';
import { EstacionServicioRead } from '@vehiculos/domain/reads';
import {
  EstacionServicioFilters,
  EstacionServicioRepository,
} from '@vehiculos/domain/repositories';
import { EstacionServicioMapper } from '@vehiculos/infrastructure/mappers';
import { SelectQueryBuilder } from 'typeorm';
import { DEPARTAMENTO_EK_SELECT, MUNICIPIO_EK_SELECT } from '../eklipse-refs';
import { EstacionServicioOrm } from '../orm';

export class TypeOrmEstacionServicioRepository
  extends BaseSource
  implements EstacionServicioRepository
{
  private get repository() {
    return this.ekConn.getRepository(EstacionServicioOrm);
  }

  async save(estacion: EstacionServicio): Promise<EstacionServicio> {
    const orm = EstacionServicioMapper.toOrm(estacion);
    const saved = await this.repository.save(orm);
    return EstacionServicioMapper.toDomain(saved);
  }

  async findById(id: number): Promise<EstacionServicio | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? EstacionServicioMapper.toDomain(orm) : null;
  }

  async update(estacion: EstacionServicio): Promise<EstacionServicio> {
    if (!estacion.getId?.getValor) return null;
    const orm = EstacionServicioMapper.toUpdateOrm(estacion);
    await this.repository.save(orm);
    return this.findById(estacion.getId.getValor);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: number): Promise<boolean> {
    return await this.repository.exists({ where: { id } });
  }

  async findViewById(id: number): Promise<EstacionServicioRead | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? EstacionServicioMapper.toView(orm) : null;
  }

  async findAllView(page: number, limit: number): Promise<[EstacionServicioRead[], number]> {
    const qb = this.baseQb();
    qb.orderBy('estacion.createdAt', 'DESC');
    qb.take(limit);
    qb.skip((page - 1) * limit);
    const [items, count] = await qb.getManyAndCount();
    return [items.map(EstacionServicioMapper.toView), count];
  }

  async findAllAndCount(
    page: number,
    limit: number,
    search?: string,
    filters?: EstacionServicioFilters
  ): Promise<[EstacionServicioRead[], number]> {
    const qb = this.baseQb();
    if (search) {
      qb.andWhere('(estacion.nombre LIKE :search OR estacion.direccion LIKE :search)', {
        search: `%${search}%`,
      });
    }
    this.applyFilters(qb, filters);
    qb.orderBy('estacion.createdAt', 'DESC');
    qb.take(limit);
    qb.skip((page - 1) * limit);
    const [items, count] = await qb.getManyAndCount();
    return [items.map(EstacionServicioMapper.toView), count];
  }

  async findAllActivas(): Promise<EstacionServicioRead[]> {
    const orms = await this.repository.find({ where: { activa: true } });
    return orms.map(EstacionServicioMapper.toView);
  }

  private baseQb(): SelectQueryBuilder<EstacionServicioOrm> {
    return this.repository
      .createQueryBuilder('estacion')
      .leftJoin('estacion.municipio', 'municipio')
      .leftJoin('municipio.departamento', 'departamento')
      .addSelect([...MUNICIPIO_EK_SELECT, ...DEPARTAMENTO_EK_SELECT]);
  }

  private applyFilters(
    qb: SelectQueryBuilder<EstacionServicioOrm>,
    filters?: EstacionServicioFilters
  ): SelectQueryBuilder<EstacionServicioOrm> {
    if (filters?.activa !== undefined) {
      qb.andWhere('estacion.activa = :activa', { activa: filters.activa });
    }
    if (filters?.municipioId) {
      qb.andWhere('municipio.id = :municipioId', { municipioId: filters.municipioId });
    }
    return qb;
  }
}
