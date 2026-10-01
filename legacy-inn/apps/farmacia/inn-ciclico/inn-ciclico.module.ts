import { Module } from '@nestjs/common';
import { InnCiclicoController } from './presentation/controllers/inn-ciclico.controller';
import {
  EstadisticasImpl,
  FetchEstantesImpl,
  FetchExistenciaProductoImpl,
  UpdateExistenciaProductoImpl,
  VerificarEstanteImpl,
  HistoricoVerificarEstanteImpl,
  RecursosImpl,
  CambioEstanteImpl,
  HistoricoCambioEstanteImpl,
  BuscarProductoImpl,
  AgregarProductoImpl,
} from './infrastructure/services';

@Module({
  controllers: [InnCiclicoController],
  providers: [
    EstadisticasImpl,
    FetchEstantesImpl,
    FetchExistenciaProductoImpl,
    UpdateExistenciaProductoImpl,
    VerificarEstanteImpl,
    HistoricoVerificarEstanteImpl,
    RecursosImpl,
    CambioEstanteImpl,
    HistoricoCambioEstanteImpl,
    BuscarProductoImpl,
    AgregarProductoImpl,
  ],
})
export class InnCiclicoModule {}
