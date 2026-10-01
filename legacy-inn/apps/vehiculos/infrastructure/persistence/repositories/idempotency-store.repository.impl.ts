import { BaseSource } from '@common/infrastructure/services';
import { IdempotencyStoreRepository } from '@vehiculos/domain/repositories';
import { IdempotencyStoreOrm } from '../orm';
import { resolveRepository } from '@common/infrastructure/persistence/transactional';

export class TypeOrmIdempotencyStoreRepository
  extends BaseSource
  implements IdempotencyStoreRepository
{
  private get repository() {
    return resolveRepository(this.conn, IdempotencyStoreOrm);
  }

  async findByKey(key: string): Promise<{ responseBody: string; responseHash: string } | null> {
    const orm = await this.repository.findOne({ where: { idempotencyKey: key } });
    if (!orm) return null;
    return {
      responseBody: orm.responseBody,
      responseHash: orm.responseHash,
    };
  }

  async save(
    key: string,
    responseHash: string,
    responseBody: string,
    ttlMinutes: number = 60
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
    const orm = new IdempotencyStoreOrm();
    orm.idempotencyKey = key;
    orm.responseHash = responseHash;
    orm.responseBody = responseBody;
    orm.createdAt = now;
    orm.expiresAt = expiresAt;
    await this.repository.save(orm);
  }

  async exists(key: string): Promise<boolean> {
    return await this.repository.exists({ where: { idempotencyKey: key } });
  }
}
