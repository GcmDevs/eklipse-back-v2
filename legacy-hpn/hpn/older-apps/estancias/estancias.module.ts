import { Module } from '@nestjs/common';
import { EstanciasService } from './estancias.service';
import { EstanciasController } from './estancias.controller';
import { Estancias2Controller } from './estancias2.controller';

@Module({
  providers: [EstanciasService],
  controllers: [EstanciasController, Estancias2Controller],
})
export class EstanciasModule {}
