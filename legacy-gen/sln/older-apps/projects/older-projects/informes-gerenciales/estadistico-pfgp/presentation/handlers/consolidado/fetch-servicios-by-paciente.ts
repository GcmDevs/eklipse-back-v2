import { FetchServiciosByConsecutivo } from '@sln/rft/informes-gerenciales/estadistico-pfgp/consolidado/application';
import { ConsolidadoProxyRepository } from '@sln/rft/informes-gerenciales/estadistico-pfgp/consolidado/infrastructure';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchServiciosByConsecutivoConsolidadoHandler {
  constructor(private _facturas: ConsolidadoProxyRepository) {}

  public async execute(codigosContratos: string[], consecutivo: number): Promise<any> {
    const fetchServiciosByConsecutivo = new FetchServiciosByConsecutivo(this._facturas);

    try {
      return await fetchServiciosByConsecutivo.execute(codigosContratos, consecutivo);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
