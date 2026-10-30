import { TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { TercerosModule } from '@inn/core/terceros/tercero.module';
import { Module, forwardRef } from '@nestjs/common';
import { FIRMA_REPOSITORY, USUARIO_REPOSITORY } from './application/repositories';
import { IDENTITY_PROVIDERS } from './application/services';
import { UsuarioEqpService } from './application/services/usuario-eqp.service';
import { TypeOrmFirmaRepository, TypeOrmUsuarioEqpRepository } from './infrastructure/persistence';
import { IDENTITY_CONTROLLERS } from './presentation/controller';

@Module({
  controllers: [...IDENTITY_CONTROLLERS],
  providers: [
    ...IDENTITY_PROVIDERS,
    {
      provide: USUARIO_REPOSITORY,
      useClass: TypeOrmUsuarioEqpRepository,
    },
    {
      provide: FIRMA_REPOSITORY,
      useClass: TypeOrmFirmaRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManagerImpl,
    },
  ],
  imports: [forwardRef(() => TercerosModule)],
  exports: [UsuarioEqpService],
})
export class IdentityModule {}
