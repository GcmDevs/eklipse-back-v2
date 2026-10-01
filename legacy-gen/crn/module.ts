import { Module } from '@nestjs/common';
import { OldImportsModule } from './older-apps/old.imports';
import { RadicacionModule } from './radicacion/radicacion.module';

@Module({
  imports: [
    //
    OldImportsModule,
    RadicacionModule,
  ],
})
export class CrnModule {}
