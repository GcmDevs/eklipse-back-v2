import {
  ContratosPayload,
  FetchContratos,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/application';
import { AcostadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

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
