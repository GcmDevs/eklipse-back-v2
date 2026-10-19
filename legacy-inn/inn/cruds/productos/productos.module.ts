import { Module } from '@nestjs/common';
import {
  AlmacenCrudController,
  EstanteCrudController,
  ProductoCrudController,
} from './presentation/controllers';
import {
  AlmacenCrudSource,
  EstanteCrudSource,
  ProductoCrudSource,
} from './infrastructure/repositories';

@Module({
  controllers: [AlmacenCrudController, EstanteCrudController, ProductoCrudController],
  providers: [AlmacenCrudSource, EstanteCrudSource, ProductoCrudSource],
})
export class ProductosModule {}
