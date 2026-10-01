import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { PaisRepository } from '@core/terceros/application/repositories';
import { Injectable } from '@nestjs/common';
import { PaisOrm } from '@orm/shared-bd';

@Injectable()
export class TypeOrmPaisRepository extends BaseSource implements PaisRepository {
  private get repository() {
    return resolveRepository(this.ekConn, PaisOrm);
  }

  async findById(id: number): Promise<PaisOrm | null> {
    return this.repository
      .createQueryBuilder('pais')
      .select([
        'pais.id',
        'pais.codigo',
        'pais.nombre',
        'pais.codigoNumerico',
        'pais.codigoIdioma',
        'pais.idioma',
        'pais.codigoAlpha',
      ])
      .where('pais.id = :id', { id })
      .getOne();
  }

  async findAll(limit: number, search?: string): Promise<PaisOrm[]> {
    const qb = this.repository
      .createQueryBuilder('pais')
      .select([
        'pais.id',
        'pais.codigo',
        'pais.nombre',
        'pais.codigoNumerico',
        'pais.codigoIdioma',
        'pais.idioma',
        'pais.codigoAlpha',
      ]);
    if (search) {
      qb.where('LOWER(pais.nombre) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }
    qb.orderBy('pais.nombre', 'ASC').take(limit);

    return qb.getMany();
  }
}
