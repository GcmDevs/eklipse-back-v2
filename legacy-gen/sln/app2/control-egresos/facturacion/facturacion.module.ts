import { Module } from '@nestjs/common';
import { EgresoFacturacionController } from './presentation/controllers/egresos-facturacion/egreso-facturacion.controller';
import { EgresoFacturacionImpl } from './infrastructure/services/egreso-facturacion.impl';
import { EgresoFacturacionPendientesController } from './presentation/controllers/egresos-facturacion/egreso-facturacion-pendientes.controller';
import { MotivoNoFacturacionImpl } from './infrastructure/services/motivo-no-facturacion.impl';
import { FacturadoresController } from '../control-facturadores/control-facturadores.controller';
import { FacturadoresImpl } from '../control-facturadores/control-facturadores.impl';

@Module({
  controllers: [
    EgresoFacturacionController,
    EgresoFacturacionPendientesController,
    FacturadoresController,
  ],
  providers: [EgresoFacturacionImpl, MotivoNoFacturacionImpl, FacturadoresImpl],
})
export class FacturacionModule {}
