import { Module } from '@nestjs/common';
import { ValoresCriticosController } from './presentation/controllers/valores-criticos.controller';
import { ValorCriticoCrudSource } from './infrastructure/repositories';

@Module({
  controllers: [ValoresCriticosController],
  providers: [ValorCriticoCrudSource],
})
export class ValoresCriticosModule {}
