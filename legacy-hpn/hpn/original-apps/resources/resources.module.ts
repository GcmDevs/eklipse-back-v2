import { Module } from '@nestjs/common';
import { AguachicaController, ResourcesSubgruposController } from './presentation/controllers';

@Module({
  controllers: [ResourcesSubgruposController, AguachicaController],
})
export class ResourcesModule {}
