import { FacturaRepository } from '../domain';
import { AgrupadoresByConsecutivoPayload } from './payloads';

export class FetchAgrupadoresByConsecutivo {
  constructor(private _facturas: FacturaRepository) {}

  public execute(payload: AgrupadoresByConsecutivoPayload): Promise<any> {
    return this._facturas.fetchAgrupadoresByConsecutivo(payload);
  }
}
