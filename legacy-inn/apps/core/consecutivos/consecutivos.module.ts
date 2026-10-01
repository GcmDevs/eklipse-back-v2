import { TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { Global, Module } from '@nestjs/common';
import { CONSECUTIVO_REPOSITORY, ConsecutivoService } from './application';
import { TypeOrmConsecutivoRepository } from './infrastructure/persistence';

@Global()
@Module({
    providers: [
        ConsecutivoService,
        {
            provide: CONSECUTIVO_REPOSITORY,
            useClass: TypeOrmConsecutivoRepository,
        },
        { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManagerImpl },
    ],
    exports: [ConsecutivoService],
})
export class ConsecutivosModule { }
