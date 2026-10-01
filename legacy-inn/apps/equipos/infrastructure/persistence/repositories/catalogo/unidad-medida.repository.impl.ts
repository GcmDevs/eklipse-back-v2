import { BaseSource } from '@common/infrastructure/services';
import { UnidadMedida } from '@equipos/domain/entities';
import { UnidadMedidaRepository } from '@equipos/domain/repositories/catalogo';
import { UnidadMedidaMapper } from '@equipos/infrastructure/mappers';
import { UnidadMedidaOrm } from '@orm/inn/equipos';
import { Repository } from 'typeorm';

export class TypeOrmUnidadMedidaRepository extends BaseSource implements UnidadMedidaRepository {
  private readonly repository: Repository<UnidadMedidaOrm> =
    this.conn.getRepository(UnidadMedidaOrm);

  async save(unidadMedida: UnidadMedida): Promise<UnidadMedida> {
    const unidadMedidaOrm = UnidadMedidaMapper.toOrm(unidadMedida);
    const unidadMedidaSaved = await this.repository.save(unidadMedidaOrm);
    return UnidadMedidaMapper.toDomain(unidadMedidaSaved);
  }

  async findById(id: number): Promise<UnidadMedida | null> {
    const unidadMedidaFound = await this.repository.findOne({
      where: { id: id },
    });
    return unidadMedidaFound ? UnidadMedidaMapper.toDomain(unidadMedidaFound) : null;
  }

  async findAll(): Promise<UnidadMedida[]> {
    const unidadesMedidaFound = await this.repository.find({
    });
    return unidadesMedidaFound.map(UnidadMedidaMapper.toDomain);
  }
}
