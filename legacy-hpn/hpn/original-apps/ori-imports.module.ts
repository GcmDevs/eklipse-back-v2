import { Module } from '@nestjs/common';
import { DietasModule } from './dietas/dietas.module';
import { ResourcesModule } from './resources/resources.module';

/** @deprecated */
@Module({
  imports: [ResourcesModule, DietasModule],
})
export class OriImportsModule {}
