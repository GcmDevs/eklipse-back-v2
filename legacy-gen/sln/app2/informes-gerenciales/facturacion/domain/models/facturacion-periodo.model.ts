export interface FacturacionPeriodoModel {
  metasPorMes: MetaMesResponse[];
  facturas: FacturaModel[];
  facturasPendientes: FacturaPendienteModel[];
  facturasPendientesAnteriores: FacturaPendienteModel[];
  ingresosSinFacturar: IngresosSinFacturarResponse[];
  ingresosAnteriores: IngresosSinFacturarResponse[];
}

export interface FacturaPendienteModel {
  fecha: string;
  idCentro: number;
  estado: number;
  total: number;
}

export interface FacturaModel {
  factura: string;
  facturaOriginal: string | null;
  tipoDocumento: number;
  fechaFacturacion: Date;
  idUsuario: number;
  nombreUsuario: string;
  totalFacturado: number;
  totalRecuperado: number;
  fueAnulado: boolean;
  fechaAnulacion: string | null;
  fechaOriginal: string | null;
  totalRefacturado: number | null;
  codigoPlanBeneficios: string;
  idEntidad: number;
  nombreEntidad: string;
  idTercero: number;
  nombreTercero: string;
  idCentro: number;
  nombreCentro: string;
  idAreaServicio: number | null;
  nombreAreaServicio: string | null;
  cantidadAnulada: number;
  fechaEgreso: Date;
  isProducidoActual: boolean;
}

export interface MetaMesResponse {
  centro: number;
  meta: number;
}

export interface IngresosSinFacturarResponse {
  idCentroAtencion: number;
  fechaIngreso: string;
  total: number;
  ingresoPor: number;
  estadoIngreso: number;
}

export interface ResumenPeriodoModel {
  mes?: string;
  totalFacturado: number;
  facturadoEvento?: number;
  facturadoPGP: number;
  deficitPGP: number;
  registroPGP: number;
  anulacionesPosterioresTotalFacturado: number;
  anulacionesPosterioresRegistroPGP: number;
  totalRefacturado: number;
}

export interface ResumenPeriodoEntidadesModel {
  centro: string;
  facturado: number;
  refacturado: number;
  facturadoEventos: number;
  refacturadoEventos: number;
  facturadoPGP: number;
  refacturadoPGP: number;
  registroPGP: number;
  refacturadoRegistroPGP: number;
  deficitPGP: number;
  facturadoIncluyendoRegistroPGP: number;
  refacturadoIncluyendoRegistroPGP: number;
  anulacionesPosterioresTotalFacturado: number;
  anulacionesPosterioresRegistroPGP: number;
}
