import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TanqueoCorreccion } from '@inn/operaciones/tanqueos/domain/entities';
import { TanqueoCorreccionRepository } from '@inn/operaciones/tanqueos/domain/repositories';
import { TanqueoCorreccionMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers';
import { TanqueoCorreccionOrm } from '../orm';

export class TypeOrmTanqueoCorreccionRepository
  extends BaseSource
  implements TanqueoCorreccionRepository
{
  private get repository() {
    return resolveRepository(this.conn, TanqueoCorreccionOrm);
  }

  async saveMany(correcciones: TanqueoCorreccion[]): Promise<TanqueoCorreccion[]> {
    if (!correcciones.length) return [];
    const saved = await this.repository.save(correcciones.map(TanqueoCorreccionMapper.toOrm));
    return saved.map(orm => TanqueoCorreccionMapper.toDomain(orm));
  }

  async findByTanqueoId(tanqueoId: number): Promise<TanqueoCorreccion[]> {
    const orms = await this.repository.find({
      where: { tanqueo: { id: tanqueoId } },
      relations: ['tanqueo', 'usuario', 'inconsistencia'],
      order: { createdAt: 'DESC' },
    });
    return orms.map(TanqueoCorreccionMapper.toDomain);
  }

  async existsByInconsistenciaId(inconsistenciaId: number): Promise<boolean> {
    return this.repository.exist({
      where: { inconsistencia: { id: inconsistenciaId } },
    });
  }
}
