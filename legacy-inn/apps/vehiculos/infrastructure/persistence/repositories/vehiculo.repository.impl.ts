import { BaseSource } from '@common/infrastructure/services';
import { Vehiculo } from '@vehiculos/domain/entities';
import { VehiculoRead } from '@vehiculos/domain/reads';
import { VehiculoFilters, VehiculoRepository } from '@vehiculos/domain/repositories';
import { AmbulanciaMapper } from '@vehiculos/infrastructure/mappers';
import { VehiculoOrm } from '../orm';
import { SelectQueryBuilder } from 'typeorm';
import { resolveRepository } from '@common/infrastructure/persistence/transactional';

export class TypeOrmAmbulanciaRepository extends BaseSource implements VehiculoRepository {
  private get repository() {
    return resolveRepository(this.ekConn, VehiculoOrm);
  }

  async save(ambulancia: Vehiculo): Promise<Vehiculo> {
    const orm = AmbulanciaMapper.toOrm(ambulancia);
    const saved = await this.repository.save(orm);
    return this.findById(saved.id);
  }

  async findById(id: number): Promise<Vehiculo | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: this.getModeloRelations(),
    });
    return orm ? AmbulanciaMapper.toDomain(orm) : null;
  }

  async update(ambulancia: Vehiculo): Promise<Vehiculo> {
    if (!ambulancia.getId?.getValor) return null;
    await this.repository.save(AmbulanciaMapper.toUpdateOrm(ambulancia));
    return this.findById(ambulancia.getId.getValor);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: number): Promise<boolean> {
    return await this.repository.exists({ where: { id } });
  }

  async findViewById(id: number): Promise<VehiculoRead | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: this.getModeloRelations(),
    });
    return orm ? AmbulanciaMapper.toView(orm) : null;
  }

  async findAllView(page: number, limit: number): Promise<[VehiculoRead[], number]> {
    throw new Error('no implemented');
  }

  async findAllAndCount(
    page: number,
    limit: number,
    search?: string,
    filters?: VehiculoFilters
  ): Promise<[VehiculoRead[], number]> {
    const qb = this.baseQb();
    this.applyFilters(qb, search, filters);
    qb.orderBy('vehiculo.createdAt', 'DESC');
    qb.take(limit);
    qb.skip((page - 1) * limit);
    const [items, count] = await qb.getManyAndCount();
    return [items.map(AmbulanciaMapper.toView), count];
  }

  async findViewByPlaca(placa: string): Promise<VehiculoRead | null> {
    const orm = await this.repository.findOne({
      where: { placa },
      relations: this.getModeloRelations(),
    });
    return orm ? AmbulanciaMapper.toView(orm) : null;
  }

  private getModeloRelations(): string[] {
    return ['modelo', 'modelo.marca'];
  }

  private baseQb(): SelectQueryBuilder<VehiculoOrm> {
    return this.repository
      .createQueryBuilder('vehiculo')
      .leftJoinAndSelect('vehiculo.modelo', 'modelo')
      .leftJoinAndSelect('modelo.marca', 'marca');
  }

  private applyFilters(
    qb: SelectQueryBuilder<VehiculoOrm>,
    search?: string,
    filters?: VehiculoFilters
  ): SelectQueryBuilder<VehiculoOrm> {
    if (filters?.estado) {
      qb.andWhere('vehiculo.estado = :estado', { estado: filters.estado });
    }
    if (filters?.tipoActivo) {
      qb.andWhere('vehiculo.tipoActivo = :tipoActivo', { tipoActivo: filters.tipoActivo });
    }
    if (search) {
      qb.andWhere('vehiculo.placa LIKE :placa', { placa: `%${search}%` });
    }
    return qb;
  }
}
