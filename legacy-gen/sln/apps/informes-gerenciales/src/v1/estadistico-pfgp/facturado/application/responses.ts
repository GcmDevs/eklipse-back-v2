export interface ContratoResponse {
  codigoContrato: string;
  codigosContratos: string[];
  nombreContrato: string;
  totalEjecutado: number;
  valorAnticipo: number;
  totalContratado: number;
  iteraciones: number;
  errorAbsoluto: number;
  errorRelativo: number;
  porcentajeEjecutado: number;
}
