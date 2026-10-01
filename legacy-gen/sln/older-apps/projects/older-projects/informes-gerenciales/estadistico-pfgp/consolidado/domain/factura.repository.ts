import { ContratosPayload } from '../application';

export interface FacturaRepository {
  fetchContratos(payload: ContratosPayload): Promise<any[]>;

  fetchPacientesByContrato(payload: any): Promise<any>;

  fetchAgrupadoresByContrato(payload: any): Promise<any>;

  fetchServiciosByConsecutivo(codigosContratos: string[], consecutivo: number): Promise<any>;
}
