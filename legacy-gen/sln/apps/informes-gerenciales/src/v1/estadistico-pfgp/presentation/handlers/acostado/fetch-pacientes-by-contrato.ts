import { BadRequestException, Injectable } from '@nestjs/common';
import { AcostadoProxyRepository } from '../../../acostado/infrastructure';
import {
  FetchPacientesByContrato,
  PacientesByContratoPayload,
} from '../../../acostado/application';

@Injectable()
export class FetchPacientesByContratoAcostadoHandler {
  constructor(private _facturas: AcostadoProxyRepository) {}

  public async execute(payload: PacientesByContratoPayload): Promise<any> {
    const fetchPacientesByContrato = new FetchPacientesByContrato(this._facturas);

    try {
      return await fetchPacientesByContrato.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
