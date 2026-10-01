import { ContratosPayload, ContratoResponse, PacientesByContratoPayload } from '../application';

export interface FacturaRepository {
  fetchContratos(payload: ContratosPayload): Promise<ContratoResponse[]>;

  fetchPacientesByContrato(payload: PacientesByContratoPayload): Promise<any>;

  fetchEstanciasByConsecutivo(consecutivo: number): Promise<any>;

  fetchAgrupadoresByConsecutivo(consecutivo: number, codigosContratos: string[]): Promise<any>;

  fetchServiciosByConsecutivo(consecutivo: number, codigosContratos: string[]): Promise<any>;

  getDiferenciaConsolidado(payload: PacientesByContratoPayload): Promise<any>;
}
