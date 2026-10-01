import {
  FetchPacientesByContrato,
  PacientesByContratoPayload,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/application';
import { AcostadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

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
