import { TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { Global, Module } from '@nestjs/common';
import { IDEMPOTENCY_STORE_REPOSITORY } from './domain/repositories/tokens';
import { TypeOrmIdempotencyStoreRepository } from './infrastructure';

@Global()
@Module({
  providers: [
    {
      provide: IDEMPOTENCY_STORE_REPOSITORY,
      useClass: TypeOrmIdempotencyStoreRepository,
    },
    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManagerImpl },
  ],
  exports: [IDEMPOTENCY_STORE_REPOSITORY],
})
export class IdempotencyModule {}
