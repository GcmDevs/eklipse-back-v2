import { GcmContextType } from '@common/domain/types';
import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { UsuarioConSede } from '@inn/core/identity/application/repositories';
import { UsuarioOrm } from '@inn/orm/gen';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

export class TypeOrmUsuarioEqpRepository extends BaseSource {
  private readonly repository: Repository<UsuarioOrm> = this.conn.getRepository(UsuarioOrm);

  public async findById(id: number): Promise<UsuarioOrm | null> {
    const usuarioFound = await this.repository.findOne({
      where: { id },
    });
    return usuarioFound ?? null;
  }

  public async search(
    page: number,
    limit: number,
    search?: string
  ): Promise<[UsuarioOrm[], number]> {
    const qb = this.applySearchFilters(this.repository.createQueryBuilder('usuario'), search);
    const [rows, count] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return [rows, count];
  }

  public async searchTransversal(
    page: number,
    limit: number,
    search: string | undefined,
    contexto: GcmContextType
  ): Promise<[UsuarioConSede[], number]> {
    const repository = resolveRepository(this.conn, UsuarioOrm);
    const qb = this.applySearchFilters(repository.createQueryBuilder('usuario'), search);
    const [rows, count] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const sede = contexto.getForHumans();
    return [rows.map(usuario => ({ usuario, sede })), count];
  }

  private applySearchFilters(
    qb: SelectQueryBuilder<UsuarioOrm>,
    search?: string
  ): SelectQueryBuilder<UsuarioOrm> {
    const term = search?.trim();
    if (term) {
      qb.andWhere(
        new Brackets(outer => {
          outer.where('usuario.cedula LIKE :cedula', { cedula: `%${term}%` });
          outer.orWhere(
            new Brackets(inner => {
              const words = term.split(/\s+/).filter(Boolean);
              words.forEach((word, index) => {
                inner.andWhere(`usuario.nombreCompleto LIKE :nombre${index}`, {
                  [`nombre${index}`]: `%${word}%`,
                });
              });
            })
          );
        })
      );
    }

    return qb.orderBy('usuario.nombreCompleto', 'ASC').addOrderBy('usuario.id', 'ASC');
  }

}
