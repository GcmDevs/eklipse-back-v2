import { Module } from '@nestjs/common';
import { ProductosServicesController } from './presentation/controllers';
import { ExistenciasImpl } from './infrastructure/services';

@Module({
  controllers: [ProductosServicesController],
  providers: [ExistenciasImpl],
})
export class ProductosModule {}
