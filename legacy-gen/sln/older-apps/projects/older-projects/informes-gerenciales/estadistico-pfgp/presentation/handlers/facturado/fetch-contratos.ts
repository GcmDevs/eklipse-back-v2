import {
  FetchContratos,
  ContratosPayload,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/application';
import { FacturadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

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
