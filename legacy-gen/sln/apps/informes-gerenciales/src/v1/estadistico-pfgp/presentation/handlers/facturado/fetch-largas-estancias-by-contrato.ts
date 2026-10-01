import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FacturasByContratoPayload,
  FetchLargasEstanciasByContrato,
} from '../../../facturado/application';
import { FacturadoProxyRepository } from '../../../facturado/infrastructure';

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
