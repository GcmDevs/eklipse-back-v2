import { Module } from '@nestjs/common';
import {
  PacTrazAvancesEncuestaImpl,
  FetchPacientesHospitalizadosImpl,
  PacTrazRealizarEncuestaImpl,
  PacTrazFetchPacientesPreAltaImpl,
  PacTrazListarAuditoresImpl,
  PacTrazGenerarInformePdfImpl,
} from './infrastructure/services';
import { EncuestaController, RecursosController } from './presentation/controllers';

@Module({
  controllers: [RecursosController, EncuestaController],
  providers: [
    PacTrazFetchPacientesPreAltaImpl,
    FetchPacientesHospitalizadosImpl,
    PacTrazAvancesEncuestaImpl,
    PacTrazRealizarEncuestaImpl,
    PacTrazListarAuditoresImpl,
    PacTrazGenerarInformePdfImpl,
  ],
})
export class PacientesModule {}
