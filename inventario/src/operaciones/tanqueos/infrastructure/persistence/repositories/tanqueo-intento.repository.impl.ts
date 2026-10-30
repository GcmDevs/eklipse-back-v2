import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TanqueoIntento } from '@inn/operaciones/tanqueos/domain/entities';
import { EstadoIntentoTanqueo } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { TanqueoIntentoRepository } from '@inn/operaciones/tanqueos/domain/repositories';
import { TanqueoIntentoMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers';
import { TanqueoIntentoOrm } from '../orm';

export class TypeOrmTanqueoIntentoRepository extends BaseSource implements TanqueoIntentoRepository {
  private get repository() {
    return resolveRepository(this.conn, TanqueoIntentoOrm);
  }

  async save(intento: TanqueoIntento): Promise<TanqueoIntento> {
    const saved = await this.repository.save(TanqueoIntentoMapper.toOrm(intento));
    const orm = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['usuario', 'tanqueo', 'resueltoPor'],
    });
    return TanqueoIntentoMapper.toDomain(orm);
  }

  async findById(id: number): Promise<TanqueoIntento | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['usuario', 'tanqueo', 'resueltoPor'],
    });
    return orm ? TanqueoIntentoMapper.toDomain(orm) : null;
  }

  async findPendientes(page: number, limit: number): Promise<[TanqueoIntento[], number]> {
    const [orms, count] = await this.repository.findAndCount({
      where: { estado: EstadoIntentoTanqueo.PENDIENTE },
      relations: ['usuario', 'tanqueo', 'resueltoPor'],
      order: { fechaIntento: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return [orms.map(TanqueoIntentoMapper.toDomain), count];
  }

  async deleteAllPendientes(): Promise<number> {
    const result = await this.repository.delete({ estado: EstadoIntentoTanqueo.PENDIENTE });
    return result.affected ?? 0;
  }
}
