import { Module } from '@nestjs/common';
import { FacturacionPeriodoController } from './presentation/controllers';
import { FacturacionPeriodoImpl } from './infrastructure/services';

@Module({
  controllers: [FacturacionPeriodoController],
  providers: [FacturacionPeriodoImpl],
})
export class FacturacionModule {}
