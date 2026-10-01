import { Module } from '@nestjs/common';
import { ResourcesModule } from './resources/resources.module';

const modules = [ResourcesModule];
@Module({
  imports: modules,
  exports: modules,
})
export class AdmisionesModule {}
