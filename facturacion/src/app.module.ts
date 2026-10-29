import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { CuentaAltoCostoModule } from './cuenta-alto-costo';
import { GeneradorReportesModule } from './generador-reportes';
import { PreauditoriaModule } from './preauditoria/module';

@Module({
  imports: [
    // -- avoid nowrap
    CuentaAltoCostoModule,
    GeneradorReportesModule,
    PreauditoriaModule,
  ],
})
export class AppModule implements OnModuleInit {
  public async onModuleInit(): Promise<void> {
    initializeSources(ENTITIES);
  }
}
