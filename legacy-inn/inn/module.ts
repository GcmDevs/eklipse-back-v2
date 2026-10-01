import { Module } from '@nestjs/common';
import { CrudsImportsModule } from '@inn/cruds/imports';
import { AppsImportsModule } from './apps/imports';
import { OriginalImportsModule } from './original-apps/original.imports';
import { OldImportsModule } from './older-apps/old.imports';

@Module({
  imports: [
    //
    AppsImportsModule,
    CrudsImportsModule,
    OriginalImportsModule,
    OldImportsModule,
  ],
})
export class InnModule {}
