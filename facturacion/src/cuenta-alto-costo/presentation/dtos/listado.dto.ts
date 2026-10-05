export interface FiltrosListadoCac {
  buscar?: string;
  eps?: string;
  cancer?: string;
  estado?: string;
  pagina?: string;
  tamano?: string;
  ordenar?: string;
  direccion?: string;
}
export interface RegistroListadoCac {
  tipoDocumento: number | null;
  tipoDocumentoSigla: string;
  documento: string;
  paciente: string;
  codigoCie10: string;
  diagnostico: string;
  cancerPriorizado: string | null;
  eps: string;
  tipoTratamiento: string | null;
  pendiente: number;
}
export interface ListadoCacResponse {
  registros: RegistroListadoCac[];
  resumen: { registros: number; pacientes: number; pendientes: number };
  pagina: number;
  tamano: number;
}
