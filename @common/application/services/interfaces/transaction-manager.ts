import { DataSource } from 'typeorm';

export interface TransactionManager {
  transactional<T>(
    work: () => Promise<T>,
    aggregates?: Array<{ pullEvents(): any[] }>,
    correlationId?: string
  ): Promise<T>;
  transactionalOn<T>(dataSource: DataSource, work: () => Promise<T>): Promise<T>;
  nonTransactional<T>(work: () => Promise<T>): Promise<T>;
  isInTransaction(): boolean;
}
