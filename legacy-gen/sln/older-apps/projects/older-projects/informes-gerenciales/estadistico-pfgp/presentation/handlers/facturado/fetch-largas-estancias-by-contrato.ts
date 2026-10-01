import {
  FacturasByContratoPayload,
  FetchLargasEstanciasByContrato,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/application';
import { FacturadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchLargasEstanciasByContratoFacturadoHandler {
  constructor(private _facturas: FacturadoProxyRepository) {}

  public async execute(payload: FacturasByContratoPayload): Promise<any> {
    const fetchLargasEstanciasByContrato = new FetchLargasEstanciasByContrato(this._facturas);

    try {
      return await fetchLargasEstanciasByContrato.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
