import { BaseSource } from '@common/infrastructure/services';
import { GrupoEjecucionMantRepository } from 'apps/motor-formatos/application';
import { GrupoEjecucionMantRead } from 'apps/motor-formatos/application/read';
import { GrupoEjecucionMantMapper } from 'apps/motor-formatos/infrastructure/mappers';
import { In, Repository } from 'typeorm';
import { GrupoEjecucionMantOrm } from '../../orm';

export class TypeOrmGrupoEjecucionMantRepository
  extends BaseSource
  implements GrupoEjecucionMantRepository
{
  private readonly repository: Repository<GrupoEjecucionMantOrm> =
    this.conn.getRepository(GrupoEjecucionMantOrm);

  public async save(grupoEjecucion: GrupoEjecucionMantOrm): Promise<GrupoEjecucionMantRead> {
    const grupoEjecucionMantSaved = await this.repository.save(
      this.repository.create(grupoEjecucion)
    );
    return GrupoEjecucionMantMapper.toView(grupoEjecucionMantSaved);
  }

  public async findByIds(ids: number[]): Promise<GrupoEjecucionMantOrm[]> {
    if (ids.length === 0) return [];
    return await this.repository.findBy({ id: In(ids) });
  }

  public async findAll(): Promise<GrupoEjecucionMantRead[]> {
    const gruposEjecucionOrm = await this.repository.find();
    return GrupoEjecucionMantMapper.toViewList(gruposEjecucionOrm);
  }
}
