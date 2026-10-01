import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { FetchDiagnosticoByFolioHandler, FetchSubgruposCamasHandler } from './handlers';

@Module({
  controllers: [ResourcesController],
  providers: [FetchDiagnosticoByFolioHandler, FetchSubgruposCamasHandler],
})
export class ResourcesModule {}
