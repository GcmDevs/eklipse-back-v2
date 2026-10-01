import { BadRequestException, Injectable } from '@nestjs/common';
import { AcostadoProxyRepository } from '../../../acostado/infrastructure';
import { FetchEstanciasByConsecutivo } from '../../../acostado/application';

@Injectable()
export class FetchEstanciasByConsecutivoAcostadoHandler {
  constructor(private _facturas: AcostadoProxyRepository) {}

  public async execute(consecutivo: number): Promise<any> {
    const fetchEstanciasByConsecutivo = new FetchEstanciasByConsecutivo(this._facturas);

    try {
      return await fetchEstanciasByConsecutivo.execute(consecutivo);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
