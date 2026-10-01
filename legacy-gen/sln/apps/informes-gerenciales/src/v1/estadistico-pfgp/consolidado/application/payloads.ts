export interface ContratosPayload {
  inicio: Date;
  final: Date;
  idCentro: number;
  codigosContratos?: string[];
  fusiones?: any[];
  aliasFusiones?: string[];
}

export interface AgrupadoresPayload {
  inicio: Date;
  final: Date;
  idCentro: number;
  codigosContratos: string[];
}
