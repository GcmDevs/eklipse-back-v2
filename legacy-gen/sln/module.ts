import { Module } from '@nestjs/common';
import { InformesGerencialesModule } from '@sln/info-geren/informes-gerenciales.module';
import { InformesGerencialesModule as InformesGerencialesModule2 } from '@sln/informes-gerenciales/informes-gerenciales.module';
import { EstadisticoPFGPModule } from '@sln/pfgp/estadistico-pfgp.module';
import { OldImportsModule } from './older-apps/old.imports';
import { FacturacionModule } from 'sln/app2/control-egresos/facturacion/facturacion.module';

@Module({
  imports: [
    //
    InformesGerencialesModule2,
    InformesGerencialesModule,
    EstadisticoPFGPModule,
    OldImportsModule,
    FacturacionModule,
  ],
})
export class SlnModule {}
