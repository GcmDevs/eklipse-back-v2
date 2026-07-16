import { Module } from '@nestjs/common';
import {
  ActualizarAccionImpl,
  ActualizarEstanciaProlongadaImpl,
  CensoEstanciasProlongadasImpl,
  CerrarEstanciaImpl,
  CrearEstanciasProlongadasImpl,
  CrearSeguimientoImpl,
  EstanciaProlongadaByIdImpl,
  EstanciasProlongadasActivasImpl,
  EstanciasProlongadasQueryImpl,
  ListarSeguimientosImpl,
  ObtenerActivityFeedImpl,
} from './infraestructure/services/estancias';

import {
  ActualizarDominiosItemImpl,
  CrearDominioImpl,
  ObtenerDominiosImpl,
  ToggleDominioItemActivoImpl,
} from './infraestructure/services/dominio';
import {
  ListarNotificacionesImpl,
  MarcarNotificacionVistaImpl,
  ObtenerNotificacionesImpl,
} from './infraestructure/services/notificaciones';
import {
  DominiosController,
  EstanciasProlongadasController,
  NotificacionesController,
} from './presentation/controllers';

@Module({
  controllers: [EstanciasProlongadasController, NotificacionesController, DominiosController],
  providers: [
    // Estancias Prolongadas
    CensoEstanciasProlongadasImpl,
    CrearEstanciasProlongadasImpl,
    EstanciasProlongadasActivasImpl,
    EstanciasProlongadasQueryImpl,
    ObtenerActivityFeedImpl,
    CrearSeguimientoImpl,
    ListarSeguimientosImpl,
    ActualizarDominiosItemImpl,
    CerrarEstanciaImpl,
    EstanciaProlongadaByIdImpl,
    ActualizarEstanciaProlongadaImpl,
    ActualizarAccionImpl,
    // Dominio
    ObtenerDominiosImpl,
    ToggleDominioItemActivoImpl,
    CrearDominioImpl,
    ActualizarDominiosItemImpl,
    // Notificaciones
    ListarNotificacionesImpl,
    MarcarNotificacionVistaImpl,
    ObtenerNotificacionesImpl,
  ],
})
export class EstanciasProlongadasModule {}
