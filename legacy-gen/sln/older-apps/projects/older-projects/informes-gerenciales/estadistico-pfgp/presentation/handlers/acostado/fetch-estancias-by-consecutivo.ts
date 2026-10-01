import {
  ContratosPayload,
  FetchEstanciasByConsecutivo,
} from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/application';
import { AcostadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/acostado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

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
