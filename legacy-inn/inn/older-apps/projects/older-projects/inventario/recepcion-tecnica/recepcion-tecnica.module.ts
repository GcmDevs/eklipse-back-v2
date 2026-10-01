import { Module } from '@nestjs/common';
import { RecepcionTecnicaController } from './presentation/controllers';
import { RecepcionTecnicaCrudService, SugerenciasService } from './infrastructure/services';

@Module({
  controllers: [RecepcionTecnicaController],
  providers: [RecepcionTecnicaCrudService, SugerenciasService],
})
export class RecepcionTecnicaModule {}
