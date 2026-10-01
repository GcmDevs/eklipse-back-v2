import { Module } from '@nestjs/common';
import { FacturadoresController } from './control-facturadores.controller';
import { FacturadoresImpl } from './control-facturadores.impl';

@Module({
  controllers: [FacturadoresController],
  providers: [FacturadoresImpl],
})
export class ControlFacturadoresModule {}
