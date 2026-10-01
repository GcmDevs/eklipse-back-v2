import { BadRequestException, Injectable } from '@nestjs/common';
import { FacturasByContratoPayload, FetchFacturasByContrato } from '../../../facturado/application';
import { FacturadoProxyRepository } from '../../../facturado/infrastructure';

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
