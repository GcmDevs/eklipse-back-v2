import { BaseSource } from '@common/infrastructure/services';
import { EjecucionMantItemRepository } from 'apps/motor-formatos/application';
import { EjecucionMantItemRead } from 'apps/motor-formatos/application/read';
import { EjecucionMantItemMapper } from 'apps/motor-formatos/infrastructure/mappers';
import { In, Repository } from 'typeorm';
import { EjecucionMantItemOrm } from '../../orm';

export class TypeOrmEjecucionMantRepository
  extends BaseSource
  implements EjecucionMantItemRepository
{
  private readonly repository: Repository<EjecucionMantItemOrm> =
    this.conn.getRepository(EjecucionMantItemOrm);

  public async save(ejecucionMantItem: EjecucionMantItemOrm): Promise<EjecucionMantItemRead> {
    const ejecucionMantItemSaved = await this.repository.save(
      this.repository.create(ejecucionMantItem)
    );
    return EjecucionMantItemMapper.toView(ejecucionMantItemSaved);
  }

  public async findByIds(ids: number[]): Promise<EjecucionMantItemOrm[]> {
    if (ids.length === 0) return [];
    return await this.repository.findBy({ id: In(ids) });
  }

  public async findAll(): Promise<EjecucionMantItemRead[]> {
    const ejecucionesMantItemsOrm = await this.repository.find();
    return EjecucionMantItemMapper.toViewList(ejecucionesMantItemsOrm);
  }
}
