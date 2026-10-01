import { BadRequestException, Injectable } from '@nestjs/common';
import { AcostadoProxyRepository } from '../../../acostado/infrastructure';
import { FetchServiciosByConsecutivo } from '../../../acostado/application';

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
