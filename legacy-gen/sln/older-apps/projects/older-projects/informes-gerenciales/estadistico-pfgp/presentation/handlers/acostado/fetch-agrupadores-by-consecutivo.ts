import { AcostadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/infrastructure';
import { FetchAgrupadoresByConsecutivo } from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/application';
import { BadRequestException, Injectable } from '@nestjs/common';

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
