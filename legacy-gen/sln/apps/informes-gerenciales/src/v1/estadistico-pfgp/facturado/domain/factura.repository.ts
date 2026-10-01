import {
  ContratosPayload,
  ContratoResponse,
  FacturasByContratoPayload,
  AgrupadoresByConsecutivoPayload,
} from '../application';

export interface FacturaRepository {
  fetchContratos(payload: ContratosPayload): Promise<ContratoResponse[]>;

  fetchFacturasByContrato(payload: FacturasByContratoPayload): Promise<any>;

  fetchLargasEstanciasByContrato(payload: FacturasByContratoPayload): Promise<any>;

  fetchAgrupadoresByConsecutivo(payload: AgrupadoresByConsecutivoPayload): Promise<any>;

  fetchServiciosByConsecutivo(payload: AgrupadoresByConsecutivoPayload): Promise<any>;
}
