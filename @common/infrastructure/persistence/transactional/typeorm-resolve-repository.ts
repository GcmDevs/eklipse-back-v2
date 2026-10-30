import { switchConn } from '../../services/connections';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { TenantOverrideContext } from './tenant-override-context';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

export function resolveRepository<T extends ObjectLiteral>(
  ds: DataSource,
  entity: EntityTarget<T>
): Repository<T> {
  const override = TenantOverrideContext.getContexto();
  const conn = override ? switchConn(override) : ds;
  const qr = TypeOrmTransactionContext.getQueryRunner();

  return qr && qr.connection === conn
    ? qr.manager.getRepository(entity)
    : conn.getRepository(entity);
}
