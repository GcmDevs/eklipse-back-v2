import { ApiProperty } from '@nestjs/swagger';
import {
  EstadoCode,
  EstadoEspecificoCode,
  PrioridadCode,
  TipoCode,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CentroRes, EntidadBasicaRes, UsuarioBasicoRes } from '@common/infrastructure/responses';

export class BasicInfoSolicitudRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  justificacion: string;
  @ApiProperty()
  tipoCode: TipoCode;
  @ApiProperty()
  prioridadCode: PrioridadCode;
  @ApiProperty()
  dependenciaOrigenNombre: string;
  @ApiProperty()
  dependenciaDestinoNombre: string;
  @ApiProperty()
  estadoCode: EstadoCode;
  @ApiProperty()
  usuarioNombre: string;
  @ApiProperty()
  usuarioCedula: string;
  @ApiProperty()
  fechaCreacion: Date;
  @ApiProperty()
  ultimoCambioEstado: Date;
  @ApiProperty()
  totalFacturado: number;
  @ApiProperty()
  isPagoPorCajaMenor: boolean;
  @ApiProperty()
  authInSameContext: boolean;
  @ApiProperty()
  isCotizacionUnica: boolean;
  @ApiProperty()
  centroId: number;
  @ApiProperty()
  contextoCode: string;
  @ApiProperty()
  codigosOrdenes: string;
  @ApiProperty()
  nombreElementosSolicitados: string;
  @ApiProperty({ type: Number, isArray: true })
  estadosActuales: number[];
}

export class CtcPermisosRes {
  @ApiProperty()
  canSeeAllSolicitudes: boolean;
  @ApiProperty()
  canSeeSolicitudesWithValues: boolean;
  @ApiProperty()
  canAddSolicitudes: boolean;
  @ApiProperty()
  canAprobarRechazarSolicitud: boolean;
  @ApiProperty()
  canDeleteSolicitudes: boolean;
  @ApiProperty()
  canAddCotizaciones: boolean;
  @ApiProperty()
  canRecomendarItemsCotizados: boolean;
  @ApiProperty()
  canAprobarRechazarItemsRecomendados: boolean;
  @ApiProperty()
  canAddOrdenCompra: boolean;
  @ApiProperty()
  canAprobarRechazarOrdenCompra: boolean;
  @ApiProperty()
  canProgramarOrdenCompra: boolean;
  @ApiProperty()
  canContabilizarOrdenCompra: boolean;
  @ApiProperty()
  canPagarOrdenCompra: boolean;
  @ApiProperty()
  canReportarEntregaLista: boolean;
  @ApiProperty()
  canManageCajaMenor: boolean;
}

export class ProductoItemSolicitudRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  descripcion: string;
  @ApiProperty()
  precioSugerido: number;
}

export class ItemSolicitudRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  cantidad: number;
  @ApiProperty()
  nombre: string;
  @ApiProperty()
  fichaTecnica: string | null;
  @ApiProperty()
  marca: string | null;
  @ApiProperty()
  formatoInclusion: string | null;
  @ApiProperty()
  descripcion: string;
  @ApiProperty()
  tipoCode: TipoCode;
  @ApiProperty()
  producto: ProductoItemSolicitudRes;
}

export class CambioEstadoSolicitudRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  informacionAdicional: string;
  @ApiProperty()
  entidadRelacionadaId: number;
  @ApiProperty()
  archivoRelacionado: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  usuario: UsuarioBasicoRes;
  @ApiProperty()
  estadoCode: EstadoCode;
  @ApiProperty()
  estadoEspecificoCode: EstadoEspecificoCode;
}

export class PagoCotizacionRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  porcentaje: number;
  @ApiProperty()
  valorAPagar: number;
  @ApiProperty()
  valorDescuento: number;
  @ApiProperty()
  isPagoAlFinalizarTrabajo: boolean;
  @ApiProperty()
  cuentaxPagarId: number;
  @ApiProperty()
  fechaProximoPago: Date;
  @ApiProperty()
  diasPlazo: number;
  @ApiProperty()
  fechaProgramacion: Date;
  @ApiProperty()
  estadoAlProgramar: CambioEstadoSolicitudRes;
  @ApiProperty()
  estadoAlPagar: CambioEstadoSolicitudRes;
}

export class DocumentoRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  estadoCode: number;
  @ApiProperty()
  consecutivo: string;
  @ApiProperty()
  fechaCreacion: Date;
  @ApiProperty()
  creadoPor: UsuarioBasicoRes;
}

export class DocumentoCotizacionRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  tipoPagoCode: number;
  @ApiProperty()
  documento: DocumentoRes;
}

export class CuentaXPagarRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  retefuente: number;
  @ApiProperty()
  reteica: number;
  @ApiProperty()
  reteIVA: number;
  @ApiProperty()
  createdAt: Date;
}

export class ItemCotizacionRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  valorUnitario: number;
  @ApiProperty()
  IVA: number;
  @ApiProperty()
  descuento: number;
  @ApiProperty()
  isAprobado: boolean;
  @ApiProperty()
  item: ItemSolicitudRes;
}

export class CotizacionRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  fechaProgramacion: Date;
  @ApiProperty()
  isPagada: boolean;
  @ApiProperty()
  listaParaEntrega: boolean;
  @ApiProperty()
  isContabilizada: boolean;
  @ApiProperty()
  isActiva: boolean;
  @ApiProperty()
  requiereUnicaContabilizacion: boolean | null;
  @ApiProperty()
  isRecibida: boolean;
  @ApiProperty({ type: EntidadBasicaRes })
  proveedor: EntidadBasicaRes;
  @ApiProperty({ type: PagoCotizacionRes, isArray: true })
  pagos: PagoCotizacionRes[];
  @ApiProperty()
  cotDocumento: DocumentoCotizacionRes;
  @ApiProperty({ type: ItemCotizacionRes, isArray: true })
  detalle: ItemCotizacionRes[];
  @ApiProperty({ type: CuentaXPagarRes, isArray: true })
  cuentasxPagar: CuentaXPagarRes[];
  @ApiProperty()
  tipoPagoCode: number;
}

export class ComplementoSolicitudRes {
  @ApiProperty()
  authInSameContext: boolean;
  @ApiProperty()
  id: number;
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  justificacion: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  isDeleted: boolean;
  @ApiProperty()
  isFinished: boolean;
  @ApiProperty()
  isCotizacionUnica: boolean;
  @ApiProperty()
  isPagoPorCajaMenor: boolean | null;
  @ApiProperty()
  isPagoPorCajaMenorExpress: boolean | null;
  @ApiProperty()
  usuario: UsuarioBasicoRes;
  @ApiProperty()
  dependenciaOrigen: EntidadBasicaRes;
  @ApiProperty()
  dependenciaDestino: EntidadBasicaRes;
  @ApiProperty()
  centro: CentroRes;
  @ApiProperty()
  prioridadCode: PrioridadCode;
  @ApiProperty()
  estadoCode: EstadoCode;
  @ApiProperty()
  tipoCode: TipoCode;
  @ApiProperty({ type: ItemSolicitudRes, isArray: true })
  detalle: ItemSolicitudRes[];
  @ApiProperty({ type: CotizacionRes, isArray: true })
  cotizaciones: CotizacionRes[];
  @ApiProperty({ type: CambioEstadoSolicitudRes, isArray: true })
  cambiosEstado: CambioEstadoSolicitudRes[];
}

export class GenerateFileRes {
  @ApiProperty()
  url: string;
}
