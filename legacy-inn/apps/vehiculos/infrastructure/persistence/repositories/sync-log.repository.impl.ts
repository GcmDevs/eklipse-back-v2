import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { SyncLog } from '@vehiculos/domain/entities';
import { SyncLogRepository } from '@vehiculos/domain/repositories';
import { SyncLogMapper } from '@vehiculos/infrastructure/mappers';
import { SelectQueryBuilder } from 'typeorm';
import { SyncLogOrm } from '../orm';

export class TypeOrmSyncLogRepository extends BaseSource implements SyncLogRepository {
  private get repository() {
    return resolveRepository(this.conn, SyncLogOrm);
  }

  async save(syncLog: SyncLog): Promise<SyncLog> {
    const orm = SyncLogMapper.toOrm(syncLog);
    const saved = await this.repository.save(orm);
    return SyncLogMapper.toDomain(saved);
  }

  async findById(id: number): Promise<SyncLog | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['usuario'],
    });
    return orm ? SyncLogMapper.toDomain(orm) : null;
  }
}
