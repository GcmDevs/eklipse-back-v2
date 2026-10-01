import { Module } from '@nestjs/common';
import {
  AcostadoController,
  ConsolidadoController,
  FacturadoController,
} from './presentation/controllers';
import {
  FetchAgrupadoresByConsecutivoAcostadoHandler,
  FetchAgrupadoresByConsecutivoFacturadoHandler,
  FetchContratosAcostadosHandler,
  FetchContratosFacturadosHandler,
  FetchEstanciasByConsecutivoAcostadoHandler,
  FetchFacturasByContratoFacturadoHandler,
  FetchLargasEstanciasByContratoFacturadoHandler,
  FetchPacientesByContratoAcostadoHandler,
  FetchServiciosByConsecutivoAcostadoHandler,
  FetchServiciosByConsecutivoFacturadoHandler,
  FetchAgrupadoresByContratoConsolidadoHandler,
  FetchContratosConsolidadosHandler,
  FetchPacientesByContratoConsolidadoHandler,
  FetchServiciosByConsecutivoConsolidadoHandler,
} from './presentation/handlers';
import { FacturadoProxyRepository } from './facturado/infrastructure';
import { AcostadoProxyRepository } from './acostado/infrastructure';
import { ConsolidadoProxyRepository } from './consolidado/infrastructure';
//import { RegistroContratosController } from './registro-contratos.controller';

@Module({
  controllers: [
    /*  RegistroContratosController, */
    FacturadoController,
    AcostadoController,
    ConsolidadoController,
  ],
  providers: [
    /* FACTURADO */
    FetchContratosFacturadosHandler,
    FetchFacturasByContratoFacturadoHandler,
    FetchLargasEstanciasByContratoFacturadoHandler,
    FetchAgrupadoresByConsecutivoFacturadoHandler,
    FetchServiciosByConsecutivoFacturadoHandler,
    FacturadoProxyRepository,
    /* ACOSTADO */
    FetchContratosAcostadosHandler,
    FetchPacientesByContratoAcostadoHandler,
    FetchEstanciasByConsecutivoAcostadoHandler,
    FetchAgrupadoresByConsecutivoAcostadoHandler,
    FetchServiciosByConsecutivoAcostadoHandler,
    AcostadoProxyRepository,
    /* CONSOLIDADO */
    FetchContratosConsolidadosHandler,
    FetchAgrupadoresByContratoConsolidadoHandler,
    FetchPacientesByContratoConsolidadoHandler,
    FetchServiciosByConsecutivoConsolidadoHandler,
    ConsolidadoProxyRepository,
  ],
})
export class EstadisticoPfgpModule {}
