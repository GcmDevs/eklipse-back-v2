import { Module } from '@nestjs/common';
import { FacturacionModule } from './facturacion/facturacion.module';
import { InformesGerencialesModule } from './informes-gerenciales/informes-gerenciales.module';

const modules = [InformesGerencialesModule, FacturacionModule];

@Module({
  imports: modules,
  exports: modules,
})
export class OlderModule {}
