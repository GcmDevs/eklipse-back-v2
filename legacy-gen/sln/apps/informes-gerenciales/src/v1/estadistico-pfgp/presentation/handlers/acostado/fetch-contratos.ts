import { BadRequestException, Injectable } from '@nestjs/common';
import { ContratosPayload, FetchContratos } from '../../../acostado/application';
import { AcostadoProxyRepository } from '../../../acostado/infrastructure';

@Injectable()
export class FetchContratosAcostadosHandler {
  constructor(private _facturas: AcostadoProxyRepository) {}

  public async execute(payload: ContratosPayload): Promise<any> {
    const fetchContratos = new FetchContratos(this._facturas);

    try {
      return await fetchContratos.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
