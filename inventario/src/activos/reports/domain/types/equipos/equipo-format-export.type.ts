export interface EncabezadoPdf {
  pagina?: string;
}

export interface TipoAdquisicionPdf {
  compra: boolean;
  comodato: boolean;
  alquiler: boolean;
  otros: boolean;
}

export interface AdquisicionPdf {
  tipoAdquisicion: TipoAdquisicionPdf;
  fechaAdquisicion?: string;
  fechaPuestaFuncionamiento?: string;
  fechaVencimientoGarantia?: string;
  vidaUtil?: string;
  fechaFabricacion?: string;
}

export interface IdentificacionEquipoPdf {
  nombreActivo: string;
  codigo: string;
  fechaAprobacion: string;
  version: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  numeroPlaca: string;
  ubicacion: string;
  localizacion: string;
  periodicidadMantenimiento: string;
  fotoEquipo?: string;
  adquisicion: AdquisicionPdf;
}

export interface RegistroSanitarioPdf {
  aplica: boolean;
  numero?: string;
}

export interface ClasificacionBiomedicaPdf {
  prevencion: boolean;
  diagnostico: boolean;
  rehabilitacion: boolean;
  analisisLaboratorio: boolean;
  tratamientoMantVida: boolean;
  registroSanitario: RegistroSanitarioPdf;
}

export interface RiesgoPdf {
  noAplica: boolean;
  muyAltoIII: boolean;
  altoIIB: boolean;
  moderadoIIA: boolean;
  bajoI: boolean;
}

export interface MedidaAdicionalPdf {
  etiqueta: string;
  valor: string;
}

export interface DatosTecnicosPdf {
  voltaje?: string;
  corriente?: string;
  frecuencia?: string;
  potencia?: string;
  revoluciones?: string;
  condicionesAmbientales?: string;
  medidasAdicionales: MedidaAdicionalPdf[];
}

export interface VariableCalibracionSlotPdf {
  etiqueta: string;
  marcado: boolean;
}

export interface VariableCalibracionFilaPdf {
  slots: VariableCalibracionSlotPdf[];
  blanks: number;
}

export interface VariablesCalibracionPdf {
  filas: VariableCalibracionFilaPdf[];
}

export interface DatosCalibracionPdf {
  requiereCalibracion: {
    si: boolean;
    no: boolean;
  };
  frecuencia?: string;
  codigoUltimaCalibracion?: string;
  variables: VariablesCalibracionPdf;
}

export interface ManualPdf {
  usuario: boolean;
  servicio: boolean;
  fichaTecnica: boolean;
}

export interface FichaTecnicaPdf {
  clasificacionBiomedica: ClasificacionBiomedicaPdf;
  riesgo: RiesgoPdf;
  datosTecnicos: DatosTecnicosPdf;
  datosCalibracion: DatosCalibracionPdf;
  manuales?: ManualPdf;
}

export interface ProveedorPdf {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface AccesorioPdf {
  cantidad: number;
  parte: string;
  marca: string;
  referencia?: string;
}

export interface DocumentoEquipoPdf {
  nombre: string;
  aplica: boolean;
  observaciones?: string;
}

export interface EquipoPdf {
  encabezado: EncabezadoPdf;
  identificacion: IdentificacionEquipoPdf;
  fichaTecnica: FichaTecnicaPdf;
  proveedor: ProveedorPdf;
  accesorios: AccesorioPdf[];
  documentos: DocumentoEquipoPdf[];
}