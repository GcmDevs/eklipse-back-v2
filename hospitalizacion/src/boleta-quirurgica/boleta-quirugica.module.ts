import { Module } from '@nestjs/common';
import { BoletaQuirurgicaController } from './presentation/controller/boleta-quirurgica.controller';
import {
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
