import { Module } from '@nestjs/common';
import { BoletaQuirurgicaController } from './presentation/controller/boleta-quirurgica.controller';
import {
  CupsEjecutadosImpl,
  GuardarAuditoriaPreImpl,
  ActualizarCupSolicitadoImpl,
  CierreAdministrativoImpl,
  BuscarCupsImpl,
  AutorizacionBoletaQuirurgicaImpl,
  FetchBoletaQuirurgicaImpl,
  FetchDetalleBoletaQuirurgicaImpl,
  GestorQxBoletaQuirurgicaImpl,
  InicializarBoletaQuirurgicaImpl,
  MaosBoletaQuirurgicaImpl,
  ObservacionBoletaQuirurgicaImpl,
  ProgramacionBoletaQuirurgicaImpl,
} from './infraestructure/services';

@Module({
  controllers: [BoletaQuirurgicaController],
  providers: [
    CupsEjecutadosImpl,
    GuardarAuditoriaPreImpl,
    ActualizarCupSolicitadoImpl,
    CierreAdministrativoImpl,
    BuscarCupsImpl,
    FetchBoletaQuirurgicaImpl,
    FetchDetalleBoletaQuirurgicaImpl,
    AutorizacionBoletaQuirurgicaImpl,
    ObservacionBoletaQuirurgicaImpl,
    ProgramacionBoletaQuirurgicaImpl,
    GestorQxBoletaQuirurgicaImpl,
    MaosBoletaQuirurgicaImpl,
    InicializarBoletaQuirurgicaImpl,
  ],
})
export class BoletaQuirurgicaModule {}
