import { FacturaRepository } from '../domain';
import { ContratosPayload } from './payloads';
import { ContratoResponse } from './responses';

export class FetchContratos {
  constructor(private _facturas: FacturaRepository) {}

  public execute(payload: ContratosPayload): Promise<ContratoResponse[]> {
    return this._facturas.fetchContratos(payload);
  }
}
