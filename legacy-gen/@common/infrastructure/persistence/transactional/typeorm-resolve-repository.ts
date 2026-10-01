import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

export function resolveRepository<T extends ObjectLiteral>(
  ds: DataSource,
  entity: EntityTarget<T>
): Repository<T> {
  const qr = TypeOrmTransactionContext.getQueryRunner();

  return qr && qr.connection === ds
    ? qr.manager.getRepository(entity)
    : ds.getRepository(entity);
}
