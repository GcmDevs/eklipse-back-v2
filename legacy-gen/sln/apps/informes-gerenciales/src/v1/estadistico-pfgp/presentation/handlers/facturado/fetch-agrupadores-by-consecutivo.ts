import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AgrupadoresByConsecutivoPayload,
  FetchAgrupadoresByConsecutivo,
} from '../../../facturado/application';
import { FacturadoProxyRepository } from '../../../facturado/infrastructure';

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
