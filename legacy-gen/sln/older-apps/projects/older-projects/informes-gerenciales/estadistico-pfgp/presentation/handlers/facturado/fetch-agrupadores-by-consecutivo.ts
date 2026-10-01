import {
  AgrupadoresByConsecutivoPayload,
  FetchAgrupadoresByConsecutivo,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/application';
import { FacturadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchAgrupadoresByConsecutivoFacturadoHandler {
  constructor(private _facturas: FacturadoProxyRepository) {}

  public async execute(payload: AgrupadoresByConsecutivoPayload): Promise<any> {
    const fetchAgrupadoresByConsecutivos = new FetchAgrupadoresByConsecutivo(this._facturas);

    try {
      return await fetchAgrupadoresByConsecutivos.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
