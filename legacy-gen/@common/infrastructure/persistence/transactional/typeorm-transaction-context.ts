import { AsyncLocalStorage } from 'async_hooks';
import { QueryRunner } from 'typeorm';

export class TypeOrmTransactionContext {
  private static storage = new AsyncLocalStorage<QueryRunner>();

  static run(qr: QueryRunner | undefined, cb: () => Promise<any>) {
    return this.storage.run(qr, cb);
  }

  static getQueryRunner(): QueryRunner | undefined {
    return this.storage.getStore();
  }

  static isInTransaction(): boolean {
    return !!this.storage.getStore();
  }
}
