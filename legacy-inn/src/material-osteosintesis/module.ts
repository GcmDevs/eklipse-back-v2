import { Module } from '@nestjs/common';
import { LineaController } from './presentation/controllers';
import { LineaCrudSource } from './infrastructure/repositories';
import { RegistrarOfertaImpl } from './infrastructure/services';

@Module({
  controllers: [LineaController],
  providers: [LineaCrudSource, RegistrarOfertaImpl],
})
export class MaterialesOsteosintesisModule {}
