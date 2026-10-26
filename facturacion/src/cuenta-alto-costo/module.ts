import { Module } from '@nestjs/common';
import { CuentaAltoCostoController } from './presentation/controllers/cac.controller';
import { CuentaAltoCostoImpl } from './infrastructure/services/cac.impl';

@Module({
  controllers: [
    // --- AVOID NOWRAP --- //
    CuentaAltoCostoController,
  ],
  providers: [CuentaAltoCostoImpl],
})
export class CuentaAltoCostoModule {}
