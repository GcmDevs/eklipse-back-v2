import { Module } from '@nestjs/common';
import { FetchDocumentosImpl } from './infrastructure/services';
import {
  RecepcionTecnicaController,
  RecepcionTecnicaCrudController,
  SugerenciasController,
} from './presentation/controllers';
import { RCTSugerenciasImpl } from './infrastructure/services/rtc-sugerencias.impl';
import { RecepcionTecnicaCrudSource } from './infrastructure/repositories';

@Module({
  controllers: [RecepcionTecnicaCrudController, RecepcionTecnicaController, SugerenciasController],
  providers: [RecepcionTecnicaCrudSource, FetchDocumentosImpl, RCTSugerenciasImpl],
})
export class FarmaciaModule {}
