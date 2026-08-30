import { Module } from '@nestjs/common';
import { RecepcionTecnicaCrudController, SugerenciasController } from './presentation/controllers';
import {
  CreateRecepcionTecnicaImpl,
  FetchRecepcionTecnicaImpl,
  RCTSugerenciasImpl,
  UnrequiredRecepcionTecnicaImpl,
  UpdateRecepcionTecnicaImpl,
} from './infrastructure/services';

@Module({
  controllers: [RecepcionTecnicaCrudController, SugerenciasController],
  providers: [
    UnrequiredRecepcionTecnicaImpl,
    CreateRecepcionTecnicaImpl,
    UpdateRecepcionTecnicaImpl,
    FetchRecepcionTecnicaImpl,
    RCTSugerenciasImpl,
  ],
})
export class LgcRctModule {}
