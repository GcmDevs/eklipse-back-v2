import { BaseSource } from '@common/infrastructure/services';
import { Abastecimiento } from '@inn/operaciones/tanqueos/domain/entities';
import { AbastecimientoRead } from '@inn/operaciones/tanqueos/domain/reads';
import { AbastecimientoRepository } from '@inn/operaciones/tanqueos/domain/repositories';
import { AbastecimientoMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers';
import { runVehiculosPersist } from '../errors/vehiculos-persistence.error';
import { AbastecimientoOrm } from '../orm';
import { resolveRepository } from '@common/infrastructure/persistence/transactional';

export class TypeOrmAbastecimientoRepository
  extends BaseSource
  implements AbastecimientoRepository
{
  private get repository() {
    return resolveRepository(this.conn, AbastecimientoOrm);
  }

  async save(abastecimiento: Abastecimiento): Promise<Abastecimiento> {
    return runVehiculosPersist('supply', async () => {
      const saved = await this.repository.save(AbastecimientoMapper.toOrm(abastecimiento));
      return this.findById(saved.id);
    });
  }

  async findById(id: number): Promise<Abastecimiento | null> {
    const orm = await this.repository.findOne({ where: { id }, relations: this.getRelations() });
    return orm ? AbastecimientoMapper.toDomain(orm) : null;
  }

  async findViewById(id: number): Promise<AbastecimientoRead | null> {
    const orm = await this.repository.findOne({ where: { id }, relations: this.getRelations() });
    return orm ? AbastecimientoMapper.toView(orm) : null;
  }

  async findByTanqueoId(tanqueoId: number): Promise<Abastecimiento | null> {
    const orm = await this.repository.findOne({
      where: { tanqueo: { id: tanqueoId } },
      relations: this.getRelations(),
    });
    return orm ? AbastecimientoMapper.toDomain(orm) : null;
  }

  async findViewsByRepositorioId(repositorioId: number): Promise<AbastecimientoRead[]> {
    const orms = await this.repository.find({
      where: { repositorio: { id: repositorioId } },
      relations: this.getRelations(),
      order: { fechaAbastecimiento: 'DESC', id: 'DESC' },
    });
    return orms.map(AbastecimientoMapper.toView);
  }

  private getRelations(): string[] {
    return ['usuario', 'tanqueo', 'repositorio'];
  }
}
