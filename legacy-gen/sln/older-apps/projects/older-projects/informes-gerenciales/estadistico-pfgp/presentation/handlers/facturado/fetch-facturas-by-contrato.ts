import {
  FetchFacturasByContrato,
  FacturasByContratoPayload,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/application';
import { FacturadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchFacturasByContratoFacturadoHandler {
  constructor(private _facturas: FacturadoProxyRepository) {}

  public async execute(payload: FacturasByContratoPayload): Promise<any> {
    const fetchFacturasByContrato = new FetchFacturasByContrato(this._facturas);

    try {
      return await fetchFacturasByContrato.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
