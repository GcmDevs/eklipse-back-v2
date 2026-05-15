import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { DocumentosModule } from './documentos/module';
import { MAOSModule } from './maos/module';

@Module({
  imports: [
    // --- AVOID NOWRAP --- //
    DocumentosModule,
    MAOSModule,
  ],
})
export class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    initializeSources(ENTITIES);
  }
}
