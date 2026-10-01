import { BadRequestException, Injectable } from '@nestjs/common';
import { AgrupadoresPayload, FetchPacientesByContrato } from '../../../consolidado/application';
import { ConsolidadoProxyRepository } from '../../../consolidado/infrastructure';

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
