export interface ContratosPayload {
  inicio: Date;
  final: Date;
  idCentro: number;
  codigosContratos?: string[];
  fusiones?: any[];
  aliasFusiones?: string[];
}

export interface PacientesByContratoPayload {
  inicio: Date;
  final: Date;
  idCentro: number;
  codigosContratos: string[];
}
