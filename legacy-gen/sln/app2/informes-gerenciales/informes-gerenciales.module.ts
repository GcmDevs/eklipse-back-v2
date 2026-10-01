import { Module } from '@nestjs/common';
import { FacturacionModule } from './facturacion/facturacion.module';

@Module({
  imports: [FacturacionModule],
})
export class InformesGerencialesModule {}
