import { BadRequestException, Injectable } from '@nestjs/common';
import { AgrupadoresPayload, FetchAgrupadoresByContrato } from '../../../consolidado/application';
import { ConsolidadoProxyRepository } from '../../../consolidado/infrastructure';

@Injectable()
export class FetchAgrupadoresByContratoConsolidadoHandler {
  constructor(private _facturas: ConsolidadoProxyRepository) {}

  public async execute(payload: AgrupadoresPayload): Promise<any> {
    const fetchAgrupadoresByContrato = new FetchAgrupadoresByContrato(this._facturas);

    try {
      return await fetchAgrupadoresByContrato.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
