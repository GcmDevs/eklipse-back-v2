import { FacturaRepository } from '../domain';
import { AgrupadoresPayload } from './payloads';

export class FetchAgrupadoresByContrato {
  constructor(private _facturas: FacturaRepository) {}

  public execute(payload: AgrupadoresPayload): Promise<any> {
    return this._facturas.fetchAgrupadoresByContrato(payload);
  }
}
