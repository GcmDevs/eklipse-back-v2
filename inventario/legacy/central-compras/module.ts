import { Module } from '@nestjs/common';
import {
  SolicitudCompraServicesController,
  SolicitudCompraCrudController,
  CotizacionServicesController,
  CTCRecursosController,
  CotizacionCrudController,
  CotizacionFilesController,
  CotizacionPrefabricadaController,
  SetController,
} from './presentation/controllers';
import {
  CotizacionCrudSource,
  CotizacionPrefabricadaCrudSource,
  SetCrudSource,
  SolicitudCrudSource,
} from './infrastructure/repositories';
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
  CotizacionPrefabricadaServices,
  CotizacionServicesSource,
  CTCRecursosImpl,
  FetchItemsImpl,
  SolicitudServicesSource,
} from './infrastructure/services';
import {
  ItemsRecomendadosByCotizadorImpl,
  UpdateSolicitudColaboradorImpl,
  AprobacionGerenteImpl,
  FetchMisPermisosImpl,
  UpdateItemSolicitudCompraImpl,
} from './infrastructure/services/solicitud-services';
import { CreateCotizacionImpl } from './infrastructure/repositories/cotizacion-crud';
import { FilesCotizacionesImpl } from './infrastructure/services/files';

@Module({
  controllers: [
    SolicitudCompraServicesController,
    SolicitudCompraCrudController,
    CotizacionServicesController,
    CotizacionFilesController,
    CotizacionCrudController,
    CTCRecursosController,
    CotizacionPrefabricadaController,
    SetController,
  ],
  providers: [
    CotizacionServicesSource,
    SolicitudServicesSource,
    CotizacionCrudSource,
    SolicitudCrudSource,
    CotizacionPrefabricadaCrudSource,
    SetCrudSource,
    CotizacionPrefabricadaServices,
    FilesCotizacionesImpl,
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
    FetchItemsImpl,
  ],
})
export class LgcCtcModule {}
