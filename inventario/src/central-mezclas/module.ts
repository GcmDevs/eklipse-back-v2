import { Module } from '@nestjs/common';
import { RecursosController, SolicitudesController } from './presentation/controllers';
import {
  FetchSolicitudesImpl,
  CreateSolicitudImpl,
  FetchPacientesByPatternImpl,
  FetchMedicamentosByPatternImpl,
} from './infrastructure/services';

@Module({
  controllers: [RecursosController, SolicitudesController],
  providers: [
    FetchSolicitudesImpl,
    CreateSolicitudImpl,
    FetchPacientesByPatternImpl,
    FetchMedicamentosByPatternImpl,
  ],
})
export class CentralMezclasModule {}
