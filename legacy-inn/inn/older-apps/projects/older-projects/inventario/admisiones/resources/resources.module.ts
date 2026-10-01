import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { IngresosSuggestionsHandler } from './handlers';

@Module({
  controllers: [ResourcesController],
  providers: [IngresosSuggestionsHandler],
})
export class ResourcesModule {}
