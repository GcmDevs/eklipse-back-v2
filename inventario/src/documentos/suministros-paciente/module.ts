import { Module } from '@nestjs/common';
import {
  RecursosController,
  SuministrosAuthUnreqController,
  SuministrosController,
} from './presentation/controllers';
import {
  ModificarSuministrosRecibidosImpl,
  RecibirSuministrosAuthUnreqImpl,
  RecibirSuministrosImpl,
  SuministrosListosParaEntregaImpl,
} from './infrastructure/services';

@Module({
  controllers: [
    // --- AVOID NOWRAP --- //
    RecursosController,
    SuministrosController,
    SuministrosAuthUnreqController,
  ],
  providers: [
    RecibirSuministrosImpl,
    ModificarSuministrosRecibidosImpl,
    RecibirSuministrosAuthUnreqImpl,
    SuministrosListosParaEntregaImpl,
  ],
})
export class SumPacModule {}
