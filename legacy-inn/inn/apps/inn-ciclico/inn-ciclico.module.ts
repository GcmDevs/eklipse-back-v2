import { Module } from '@nestjs/common';
import { InnCiclicoServicesController } from './presentation/controllers';
import {
  FetchHistoricoReporteExistenciaProductoImpl,
  HistoricoVerificacionEstanteImpl,
  UpdateExistenciaProductoImpl,
  VerificarEstanteImpl,
} from './infrastructure/services';

@Module({
  controllers: [InnCiclicoServicesController],
  providers: [
    FetchHistoricoReporteExistenciaProductoImpl,
    UpdateExistenciaProductoImpl,
    VerificarEstanteImpl,
    HistoricoVerificacionEstanteImpl,
  ],
})
export class InnCiclicoModule {}
