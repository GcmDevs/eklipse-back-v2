export interface FacturacionPeriodoModel {
  metasPorMes: MetaMesResponse[];
  facturas: FacturaModel[];
  facturasPendientes: FacturaPendienteModel[];
  ingresosSinFacturar: IngresosSinFacturarResponse[];
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
  fechaFacturacion: string;
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
