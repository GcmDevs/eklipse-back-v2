import { BadRequestException, Injectable } from '@nestjs/common';
import { ContratosPayload, FetchContratos } from '../../../facturado/application';
import { FacturadoProxyRepository } from '../../../facturado/infrastructure';

@Injectable()
export class FetchContratosFacturadosHandler {
  constructor(private _facturas: FacturadoProxyRepository) {}

  public async execute(payload: ContratosPayload): Promise<any> {
    const fetchContratos = new FetchContratos(this._facturas);

    try {
      return await fetchContratos.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
