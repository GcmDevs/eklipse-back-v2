import { Module } from '@nestjs/common';
import { OriImportsModule } from './original-apps/original-imports';
import { OldImportsModule } from './older-apps/old.imports';

@Module({
  imports: [
    //
    OriImportsModule,
    OldImportsModule,
  ],
})
export class HcnModule {}
