import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsolidadoProxyRepository } from '../../../consolidado/infrastructure';
import { FetchServiciosByConsecutivo } from '../../../consolidado/application';

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
