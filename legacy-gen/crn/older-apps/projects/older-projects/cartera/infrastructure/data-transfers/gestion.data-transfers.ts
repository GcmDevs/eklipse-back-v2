export interface GestionResponse {
  OID: number;
  GENUSUARIO: number;
  USUNOMBRE: string;
  USUDESCRI: string;
  FECHA: string;
  GENTERCER: number;
  TERNOMCOM: string;
  TELEFTERC: string;
  RESPTERC: string;
  MOTLLAMAD: string;
  OBSERVACION: string;
  FECHCONCI: string;
  TIPCONCI: 'CARTERA' | 'GLOSAS';
}
