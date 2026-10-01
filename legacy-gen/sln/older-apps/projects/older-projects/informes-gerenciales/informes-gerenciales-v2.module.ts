import { Module } from '@nestjs/common';
import { EstadisticoPfgpModule } from './estadistico-pfgp/presentation/estadistico-pfgp.module';
import { FacturacionV2Module } from './facturacion';

const modules = [FacturacionV2Module, EstadisticoPfgpModule];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class InformesGerencialesV2Module {}
