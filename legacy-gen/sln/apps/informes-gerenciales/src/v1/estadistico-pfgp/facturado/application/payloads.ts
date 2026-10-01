export interface ContratosPayload {
  inicio: Date;
  final: Date;
  idCentro: number;
  codigosContratos?: string[];
  fusiones?: any[];
  aliasFusiones?: string[];
}

export interface FacturasByContratoPayload {
  inicio: Date;
  final: Date;
  idCentro: number;
  codigosContratos: string[];
}

export interface AgrupadoresByConsecutivoPayload {
  inicio: Date;
  final: Date;
  idCentro: number;
  codigosContratos: string[];
  consecutivo: number;
}
