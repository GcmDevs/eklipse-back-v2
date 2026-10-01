import { FacturaRepository } from '../domain';
import { FacturasByContratoPayload } from './payloads';

export class FetchFacturasByContrato {
  constructor(private _facturas: FacturaRepository) {}

  public execute(payload: FacturasByContratoPayload): Promise<any> {
    return this._facturas.fetchFacturasByContrato(payload);
  }
}
