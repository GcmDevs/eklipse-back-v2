import { Module } from '@nestjs/common';
import { InformesGerencialesV1Module } from './v1/informes-gerenciales.v1.module';

@Module({
  imports: [InformesGerencialesV1Module],
})
export class InformesGerencialesModule {}
