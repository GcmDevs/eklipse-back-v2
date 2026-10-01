import { Module } from '@nestjs/common';
import { ReferenciaController } from './referencia.controller';
import { ReferenciaSource } from './referencia.source';

@Module({
  controllers: [ReferenciaController],
  providers: [ReferenciaSource],
})
export class ReferenciaModule {}
