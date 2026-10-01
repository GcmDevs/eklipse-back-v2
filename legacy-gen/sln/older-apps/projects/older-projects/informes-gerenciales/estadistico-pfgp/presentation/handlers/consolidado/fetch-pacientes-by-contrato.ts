import { FetchPacientesByContrato } from '@sln/rft/informes-gerenciales/estadistico-pfgp/consolidado/application';
import { AgrupadoresPayload } from '@sln/rft/informes-gerenciales/estadistico-pfgp/consolidado/application';
import { ConsolidadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/consolidado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchPacientesByContratoConsolidadoHandler {
  constructor(private _facturas: ConsolidadoProxyRepository) {}

  public async execute(payload: AgrupadoresPayload): Promise<any> {
    const fetchPacientesByContrato = new FetchPacientesByContrato(this._facturas);

    try {
      return await fetchPacientesByContrato.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
