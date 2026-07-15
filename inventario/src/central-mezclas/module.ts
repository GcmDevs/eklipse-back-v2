import { Module } from '@nestjs/common';
import { RecursosController, SolicitudesController } from './presentation/controllers';
import {
  FetchSolicitudesImpl,
  CreateSolicitudImpl,
  GestionarSolicitudImpl,
  UpdateSolicitudImpl,
  FetchPacientesByPatternImpl,
  FetchMedicamentosByPatternImpl,
} from './infrastructure/services';

@Module({
  controllers: [RecursosController, SolicitudesController],
  providers: [
    FetchSolicitudesImpl,
    CreateSolicitudImpl,
    GestionarSolicitudImpl,
    UpdateSolicitudImpl,
    FetchPacientesByPatternImpl,
    FetchMedicamentosByPatternImpl,
  ],
})
export class CentralMezclasModule {}
