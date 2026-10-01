import { Module } from '@nestjs/common';
import { CamaServicesController } from './presentation/controllers';
import { FetchCamasForHome } from './infrastructure/services';

@Module({
  controllers: [CamaServicesController],
  providers: [FetchCamasForHome],
})
export class CamasModule {}
