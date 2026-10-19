import { Module } from '@nestjs/common';
import { GEN_PROVIDERS, MUNICIPIO_REPOSITORY } from './application';
import { TypeOrmMunicipioRepository } from './infrastructure/persistence';
import { GEN_CONTROLLERS } from './presentation/controllers';

@Module({
  controllers: [...GEN_CONTROLLERS],
  providers: [
    ...GEN_PROVIDERS,
    {
      provide: MUNICIPIO_REPOSITORY,
      useClass: TypeOrmMunicipioRepository,
    },
  ],
  exports: [...GEN_PROVIDERS],
})
export class GenModule {}
