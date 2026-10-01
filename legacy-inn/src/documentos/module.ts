import { Module } from '@nestjs/common';
import {
  RecibirOrdenDespachoAuthUnreqController,
  RecibirOrdenDespachoController,
  RecursosController,
  SuministrosAuthUnreqController,
  SuministrosController,
} from './presentation/controllers';
import {
  FetchOrdenesDespachoPendientesImpl,
  RecibirItemsOrdenDespachoImpl,
} from './infrastructure/services/orden-despacho';
import {
  ModificarSuministrosRecibidosImpl,
  RecibirSuministrosAuthUnreqImpl,
  RecibirSuministrosImpl,
  SuministrosListosParaEntregaImpl,
} from './infrastructure/services/suministro-paciente';

@Module({
  controllers: [
    RecibirOrdenDespachoController,
    RecursosController,
    RecibirOrdenDespachoAuthUnreqController,
    SuministrosController,
    SuministrosAuthUnreqController,
  ],
  providers: [
    FetchOrdenesDespachoPendientesImpl,
    RecibirItemsOrdenDespachoImpl,
    RecibirSuministrosImpl,
    ModificarSuministrosRecibidosImpl,
    RecibirSuministrosAuthUnreqImpl,
    SuministrosListosParaEntregaImpl,
  ],
})
export class DocumentosModule {}
