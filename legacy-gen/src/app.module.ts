import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { EnlExtModule } from './enlaces-externos/module';
import { SecurityModule } from './security/module';
import { ENTITIES } from './app.entities';
import { DependenciasModule } from './dependencias/module';
import { PacientesModule } from './pacientes/module';
import { RecursosModule } from './recursos/module';
import { HcnModule } from 'hcn/module';
import { CrnModule } from 'crn/module';
import { SlnModule } from 'sln/module';

@Module({
  imports: [
    //
    EnlExtModule,
    HcnModule,
    SlnModule,
    CrnModule,
    SecurityModule,
    DependenciasModule,
    PacientesModule,
    RecursosModule,
  ],
})
export class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    initializeSources(ENTITIES);
  }
}
