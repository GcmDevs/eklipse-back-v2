import { Module } from '@nestjs/common';
import {
  SolicitudCompraServicesController,
  SolicitudCompraCrudController,
  CotizacionServicesController,
  CTCRecursosController,
  CotizacionCrudController,
  CotizacionFilesController,
} from './presentation/controllers';
import { CotizacionCrudSource, SolicitudCrudSource } from './infrastructure/repositories';
import {
  FetchComplementoSolicitudImpl,
  FetchResumenSolicitudesImpl,
  UpdateSolicitudCompraImpl,
  CancelarSolicitudImpl,
  CreateSolicitudImpl,
} from './infrastructure/repositories/solicitud-crud';
import {
  ReportarOrdenCompraListaParaEntregaImpl,
  ContabilizarOrdenCompraImpl,
  ProgramarOrdenCompraImpl,
  AgregarOrdenCompraImpl,
  RecibirOrdenCompraImpl,
  PagarOrdenCompraImpl,
  ConfirmarOrdenCompraImpl,
  UpdateProveedorCotizacionImpl,
} from './infrastructure/services/cotizacion-services';
import {
  CotizacionServicesSource,
  CTCRecursosImpl,
  SolicitudServicesSource,
} from './infrastructure/services';
import {
  ItemsRecomendadosByCotizadorImpl,
  UpdateSolicitudColaboradorImpl,
  AprobacionGerenteImpl,
  FetchMisPermisosImpl,
  UpdateItemSolicitudCompraImpl,
} from './infrastructure/services/solicitud-services';
// ViEJOS
import {
  SolicitudCrudController,
  SolicitudAprobacionesController,
  SolicitudServiceController,
  CotizacionCrudController as CotizacionCrudViejaController,
  CotizacionServiceController,
  CotizacionAprobacionesController,
  ResourcesController,
  CotizacionPrefabricadaController,
  SetController,
  EstadisticaController,
} from './presentation/control';
import { CotizacionPrefabricadaBaseSource, CentralComprasSource } from './infrastructure/base';
import {
  SolicitudCrudSource as SolicitudCrudSourceVieja,
  CotizacionCrudSource as CotizacionCrudSourceVieja,
  CotizacionPrefabricadaCrudSource,
  SetCrudSource,
} from './infrastructure/repos';
import {
  OrdenListaParaEntregaImpl,
  ServicesSolicitudesImpl,
  AprobacionesSolicitudesImpl,
  AprobacionesCotizacionesImpl,
  AddOrdenToCotizacionImpl,
  ConfirmarOrdenImpl,
  ContabilizarOrdenImpl,
  PagarOrdenImpl,
  ProgramarOrdenImpl,
  CotizacionServicesImpl,
  CotizacionPrefabricadaServices,
  FetchItemsImpl,
} from './infrastructure/servis';
import { ResourcesHandler } from './presentation/handlers';
import { RecibirOrdenImpl } from './infrastructure/servis/cotizacion/recibir-orden.impl';
import { FilesCotizacionesImpl } from './infrastructure/services/files';
import { FetchSolicitudesImpl, UpdateSolicitudesImpl } from './infrastructure/servis/solicitudes';
import { CreateCotizacionImpl } from './infrastructure/repositories/cotizacion-crud';

@Module({
  controllers: [
    SolicitudCompraServicesController,
    SolicitudCompraCrudController,
    CotizacionServicesController,
    CotizacionFilesController,
    CotizacionCrudController,
    CTCRecursosController,
    //VIEJOS
    ResourcesController,
    SolicitudCrudController,
    SolicitudAprobacionesController,
    SolicitudServiceController,
    CotizacionCrudViejaController,
    CotizacionServiceController,
    CotizacionAprobacionesController,
    CotizacionPrefabricadaController,
    EstadisticaController,
    SetController,
  ],
  providers: [
    CotizacionServicesSource,
    SolicitudServicesSource,
    CotizacionCrudSource,
    SolicitudCrudSource,
    ReportarOrdenCompraListaParaEntregaImpl,
    ItemsRecomendadosByCotizadorImpl,
    UpdateSolicitudColaboradorImpl,
    FetchComplementoSolicitudImpl,
    UpdateItemSolicitudCompraImpl,
    UpdateProveedorCotizacionImpl,
    FetchResumenSolicitudesImpl,
    ContabilizarOrdenCompraImpl,
    UpdateSolicitudCompraImpl,
    ProgramarOrdenCompraImpl,
    ConfirmarOrdenCompraImpl,
    AgregarOrdenCompraImpl,
    RecibirOrdenCompraImpl,
    CancelarSolicitudImpl,
    AprobacionGerenteImpl,
    PagarOrdenCompraImpl,
    FetchMisPermisosImpl,
    CreateCotizacionImpl,
    CreateSolicitudImpl,
    CTCRecursosImpl,
    // VIEJOS
    ResourcesHandler,
    OrdenListaParaEntregaImpl,
    CentralComprasSource,
    SolicitudCrudSourceVieja,
    ServicesSolicitudesImpl,
    CotizacionCrudSourceVieja,
    AprobacionesSolicitudesImpl,
    AprobacionesCotizacionesImpl,
    FilesCotizacionesImpl,
    AddOrdenToCotizacionImpl,
    ConfirmarOrdenImpl,
    ContabilizarOrdenImpl,
    PagarOrdenImpl,
    ProgramarOrdenImpl,
    RecibirOrdenImpl,
    CotizacionServicesImpl,
    CotizacionPrefabricadaBaseSource,
    CotizacionPrefabricadaCrudSource,
    CotizacionPrefabricadaServices,
    FetchItemsImpl,
    FetchSolicitudesImpl,
    UpdateSolicitudesImpl,
    SetCrudSource,
  ],
})
export class CentralComprasModule {}
