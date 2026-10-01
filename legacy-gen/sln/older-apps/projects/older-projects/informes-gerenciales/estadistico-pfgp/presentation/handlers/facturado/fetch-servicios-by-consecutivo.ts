import {
  AgrupadoresByConsecutivoPayload,
  FetchServiciosByConsecutivo,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/application';
import { FacturadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/facturado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchServiciosByConsecutivoFacturadoHandler {
  constructor(private _facturas: FacturadoProxyRepository) {}

  public async execute(payload: AgrupadoresByConsecutivoPayload): Promise<any> {
    const fetchServiciosByConsecutivos = new FetchServiciosByConsecutivo(this._facturas);

    try {
      return await fetchServiciosByConsecutivos.execute(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
