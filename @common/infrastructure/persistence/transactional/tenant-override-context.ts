import { GcmContextType } from '@common/domain/types';
import { AsyncLocalStorage } from 'async_hooks';
import { TypeOrmTransactionContext } from './typeorm-transaction-context';

export class TenantOverrideContext {
  private static readonly storage = new AsyncLocalStorage<GcmContextType>();

  static run<T>(contexto: GcmContextType, fn: () => Promise<T>): Promise<T> {
    if (TypeOrmTransactionContext.isInTransaction()) {
      throw new Error(
        'TenantOverrideContext no puede usarse dentro de una transacción activa: ' +
          'la transacción ya esta atada a una conexión especifica.'
      );
    }
    return this.storage.run(contexto, fn);
  }

  static getContexto(): GcmContextType | undefined {
    return this.storage.getStore();
  }
}

export const withTenantOverride = <T>(contexto: GcmContextType, fn: () => Promise<T>): Promise<T> =>
  TenantOverrideContext.run(contexto, fn);
