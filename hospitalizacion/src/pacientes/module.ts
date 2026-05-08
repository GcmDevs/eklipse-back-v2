import { Module } from '@nestjs/common';
import {
  PacTrazAvancesEncuestaImpl,
  FetchPacientesHospitalizadosImpl,
  PacTrazRealizarEncuestaImpl,
  PacTrazFetchPacientesPreAltaImpl,
} from './infrastructure/services';
import { EncuestaController, RecursosController } from './presentation/controllers';

@Module({
  controllers: [RecursosController, EncuestaController],
  providers: [
    PacTrazFetchPacientesPreAltaImpl,
    FetchPacientesHospitalizadosImpl,
    PacTrazAvancesEncuestaImpl,
    PacTrazRealizarEncuestaImpl,
  ],
})
export class PacientesModule {}
