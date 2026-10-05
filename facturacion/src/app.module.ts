import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { CuentaAltoCostoModule } from './cuenta-alto-costo';

@Module({
  imports: [
    // -- avoid nowrap
    CuentaAltoCostoModule,
  ],
})
export class AppModule implements OnModuleInit {
  public async onModuleInit(): Promise<void> {
    initializeSources(ENTITIES);
  }
}
