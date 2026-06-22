import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { DocumentosModule } from './documentos/module';
import { MAOSModule } from './maos/module';
import { CentralMezclasModule } from './central-mezclas/module';
import { PollaMundialistaModule } from './polla-mundialista/module';

@Module({
  imports: [
    // --- AVOID NOWRAP --- //
    DocumentosModule,
    MAOSModule,
    CentralMezclasModule,
    PollaMundialistaModule,
  ],
})
export class AppModule implements OnModuleInit {
  public async onModuleInit(): Promise<void> {
    initializeSources(ENTITIES);
  }
}
