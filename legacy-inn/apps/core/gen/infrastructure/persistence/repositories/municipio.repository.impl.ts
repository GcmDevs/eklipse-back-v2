import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { MunicipioFilters, MunicipioRepository } from '@core/gen/application/repositories';
import { MunicipioOrm } from '@orm/shared-bd';
import { SelectQueryBuilder } from 'typeorm';

export class TypeOrmMunicipioRepository extends BaseSource implements MunicipioRepository {
  private get repository() {
    return resolveRepository(this.ekConn, MunicipioOrm);
  }

  async findAllAndCount(
    page: number,
    limit: number,
    search?: string,
    filters?: MunicipioFilters
  ): Promise<[MunicipioOrm[], number]> {
    const qb = this.baseQb();
    this.applyFilters(qb, search, filters);
    qb.orderBy('municipio.nombre', 'ASC');
    qb.take(limit);
    qb.skip((page - 1) * limit);
    const [items, count] = await qb.getManyAndCount();
    return [items, count];
  }

  private baseQb(): SelectQueryBuilder<MunicipioOrm> {
    return this.repository
      .createQueryBuilder('municipio')
      .select([
        'municipio.id',
        'municipio.codigo',
        'municipio.nombre',
        'municipio.codigoDepartamentoMunicipio',
      ])
      .leftJoin('municipio.departamento', 'departamento')
      .addSelect(['departamento.id', 'departamento.codigo', 'departamento.nombre']);
  }

  private applyFilters(
    qb: SelectQueryBuilder<MunicipioOrm>,
    search?: string,
    filters?: MunicipioFilters
  ): SelectQueryBuilder<MunicipioOrm> {
    if (search) {
      qb.andWhere('municipio.nombre LIKE :search', { search: `%${search}%` });
    }
    if (filters?.departamentoId) {
      qb.andWhere('departamento.id = :departamentoId', { departamentoId: filters.departamentoId });
    }
    return qb;
  }
}
