import { BadRequestException, Injectable } from '@nestjs/common';
import { GetFacturacionTerceros } from '../../application';
import { FacturacionTerceroMesModel } from '../../domain';
import { FacturacionProxyRepository } from '../../infrastructure';

@Injectable()
export class GetFacturacionTercerosHandler {
  constructor(private _facturacion: FacturacionProxyRepository) {}

  public async execute(
    inicio: Date,
    final: Date,
    centroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    if (inicio > final) {
      throw new BadRequestException('El rango de fecha es invalido');
    }

    try {
      const getFacturacionTerceros = new GetFacturacionTerceros(this._facturacion);

      return await getFacturacionTerceros.execute(inicio, final, centroId, byDay);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async executeByCentro(
    inicio: Date,
    final: Date,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    if (inicio > final) {
      throw new BadRequestException('El rango de fecha es invalido');
    }

    try {
      const getFacturacionTerceros = new GetFacturacionTerceros(this._facturacion);

      return await getFacturacionTerceros.executeByCentro(inicio, final, byDay);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
