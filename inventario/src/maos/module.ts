import { Module } from '@nestjs/common';
import { MAOSServicesController } from './presentation/controllers';
import { FetchDataImpl } from './infrastructure/services';

@Module({
  controllers: [MAOSServicesController],
  providers: [FetchDataImpl],
})
export class MAOSModule {}
