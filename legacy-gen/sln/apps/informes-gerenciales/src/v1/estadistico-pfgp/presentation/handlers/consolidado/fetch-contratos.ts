import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsolidadoProxyRepository } from '../../../consolidado/infrastructure';
import { ContratosPayload, FetchContratos } from '../../../consolidado/application';

@Injectable()
export class FetchContratosConsolidadosHandler {
  constructor(private _facturas: ConsolidadoProxyRepository) {}

  public async execute(payload: ContratosPayload): Promise<any> {
    const fetchContratos = new FetchContratos(this._facturas);

    try {
      return await fetchContratos.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
