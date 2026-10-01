import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AgrupadoresByConsecutivoPayload,
  FetchServiciosByConsecutivo,
} from '../../../facturado/application';
import { FacturadoProxyRepository } from '../../../facturado/infrastructure';

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
