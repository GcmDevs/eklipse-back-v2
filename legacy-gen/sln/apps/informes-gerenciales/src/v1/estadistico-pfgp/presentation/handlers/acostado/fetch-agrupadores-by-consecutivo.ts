import { BadRequestException, Injectable } from '@nestjs/common';
import { AcostadoProxyRepository } from '../../../acostado/infrastructure';
import { FetchAgrupadoresByConsecutivo } from '../../../acostado/application';

@Injectable()
export class FetchAgrupadoresByConsecutivoAcostadoHandler {
  constructor(private _facturas: AcostadoProxyRepository) {}

  public async execute(consecutivo: number, codigosContratos: string[]): Promise<any> {
    const fetchAgrupadoresByConsecutivo = new FetchAgrupadoresByConsecutivo(this._facturas);

    try {
      return await fetchAgrupadoresByConsecutivo.execute(consecutivo, codigosContratos);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
