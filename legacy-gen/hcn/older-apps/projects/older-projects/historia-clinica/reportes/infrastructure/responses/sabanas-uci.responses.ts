import { ViaEliminacionLiquidosTypeCode } from '@hcn/rft/historia-clinica/reportes/domain/types';

export interface InfoIngresoResponse {
  AINCONSEC: number;
  OID: number;
  HCACODIGO: string;
  HGRNOMBRE: string;
  PACNUMDOC: string;
  GPANOMCOM: string;
  HCFECREG: string;
  GDENOMBRE: string;
  PESO: number;
}

export interface LiquidoResponse {
  LIQUIDO: string;
  HORA: number;
  CANTIDAD: number;
  HCLVIAELM: ViaEliminacionLiquidosTypeCode;
  SUBGRUPO: string;
}

export interface SignoVitalResponse {
  hora: number;
  horaForHumans?: string;
  SIGNO?: string;
  valor: string;
}

export interface GlucometriaResponse {
  hora: number;
  horaForHumans: string;
  valor: number;
  observacion: string;
  insulina: string;
}
