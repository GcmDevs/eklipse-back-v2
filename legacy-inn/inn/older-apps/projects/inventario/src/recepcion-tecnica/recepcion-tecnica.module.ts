import { Module } from '@nestjs/common';
import { RecepcionTecnicaController, SugerenciasController } from './presentation/controllers';
import { RecepcionTecnicaCrudService, SugerenciasService } from './infrastructure/services';

@Module({
  controllers: [RecepcionTecnicaController, SugerenciasController],
  providers: [RecepcionTecnicaCrudService, SugerenciasService],
})
export class RecepcionTecnicaModule {}
