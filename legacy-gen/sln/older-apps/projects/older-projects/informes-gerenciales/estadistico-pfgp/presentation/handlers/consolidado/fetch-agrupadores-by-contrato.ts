import {
  AgrupadoresPayload,
  FetchAgrupadoresByContrato,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/consolidado/application';
import { ConsolidadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/consolidado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

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
