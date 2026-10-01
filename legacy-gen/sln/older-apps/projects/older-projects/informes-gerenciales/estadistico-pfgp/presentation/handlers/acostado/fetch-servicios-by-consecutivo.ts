import { AcostadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/infrastructure';
import { FetchServiciosByConsecutivo } from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/application';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchServiciosByConsecutivoAcostadoHandler {
  constructor(private _facturas: AcostadoProxyRepository) {}

  public async execute(consecutivo: number, codigosContratos: string[]): Promise<any> {
    const fetchServiciosByConsecutivo = new FetchServiciosByConsecutivo(this._facturas);

    try {
      return await fetchServiciosByConsecutivo.execute(consecutivo, codigosContratos);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
