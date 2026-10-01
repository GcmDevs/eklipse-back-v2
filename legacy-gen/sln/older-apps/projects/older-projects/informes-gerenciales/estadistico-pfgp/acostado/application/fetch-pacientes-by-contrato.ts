import { FacturaRepository } from '../domain';
import { PacientesByContratoPayload } from './payloads';

export class FetchPacientesByContrato {
  constructor(private _facturas: FacturaRepository) {}

  public execute(payload: PacientesByContratoPayload): Promise<any> {
    return this._facturas.fetchPacientesByContrato(payload);
  }
}
