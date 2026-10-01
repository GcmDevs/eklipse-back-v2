import { Module } from '@nestjs/common';
import { RecursosController } from './controllers';
import { AreaServicioImpl, DependenciaImpl } from './services/gen';

@Module({
  controllers: [RecursosController],
  providers: [AreaServicioImpl, DependenciaImpl],
})
export class RecursosModule {}
