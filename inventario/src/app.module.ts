import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { DocumentosModule } from './documentos/module';
import { MAOSModule } from './maos/module';
import { CentralMezclasModule } from './central-mezclas/module';
import { CentralComprasModule } from './central-compras/module';
import { SolicitudPedidoModule } from './solicitud-pedido/solicitud-pedido.module';

@Module({
  imports: [
    CentralComprasModule,
    DocumentosModule,
    MAOSModule,
    CentralMezclasModule,
    SolicitudPedidoModule,
  ],
})
export class AppModule implements OnModuleInit {
  public async onModuleInit(): Promise<void> {
    initializeSources(ENTITIES);
  }
}
