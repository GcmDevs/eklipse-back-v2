import { Module } from '@nestjs/common';
import { EstadisticoPfgpModule } from './estadistico-pfgp/estadistico-pfgp.module';

@Module({
  imports: [EstadisticoPfgpModule],
})
export class InformesGerencialesV1Module {}
