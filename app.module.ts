import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from './@common/infrastructure/services';
import { SecurityModule } from '@gen/security/module';
import { ENTITIES } from './app.entities';

@Module({
  imports: [
    // --- AVOID NOWRAP --- //
    SecurityModule,
  ],
})
export class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    initializeSources(ENTITIES);
  }
}
