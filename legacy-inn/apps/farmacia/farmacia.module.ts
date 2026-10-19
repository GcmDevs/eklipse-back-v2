import { Module } from '@nestjs/common';
import { RecepcionTecnicaModule } from './recepciones-tecnicas/recepcion-tecnica.module';
import { InnCiclicoModule } from './inn-ciclico/inn-ciclico.module';
import { ControlGastosModule } from './control-gastos/control-gastos.module';
import { LegalizacionFacturasModule } from './legalizacion-facturas/legalizacion-facturas.module';
import { InventarioModule } from './inventario/inventario.module';

@Module({
  imports: [
    RecepcionTecnicaModule,
    ControlGastosModule,
    InnCiclicoModule,
    LegalizacionFacturasModule,
    InventarioModule,
  ],
})
export class FarmaciaModule {}
