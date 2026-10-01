import { BadRequestException, Injectable } from '@nestjs/common';
import { GetFacturacionEntidades } from '../../application';
import { FacturacionTerceroMesModel } from '../../domain';
import { FacturacionProxyRepository } from '../../infrastructure';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class GetFacturacionEntidadesHandler {
  constructor(private _facturacion: FacturacionProxyRepository) {}

  public async execute(
    inicio: Date,
    final: Date,
    centroId: number,
    terceroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    if (inicio > final) {
      throw new BadRequestException('El rango de fecha es invalido');
    }

    try {
      const getFacturacionEntidades = new GetFacturacionEntidades(this._facturacion);

      return await getFacturacionEntidades.execute(inicio, final, centroId, terceroId, byDay);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async executeByCentro(payload: {
    inicio: Date;
    final: Date;
    centroId: number;
    terceroId: number;
    byDay: boolean;
    context: GcmContexts;
  }): Promise<FacturacionTerceroMesModel[]> {
    const { inicio, final, centroId, terceroId, byDay, context } = payload;

    if (inicio > final) {
      throw new BadRequestException('El rango de fecha es invalido');
    }

    try {
      const getFacturacionEntidades = new GetFacturacionEntidades(this._facturacion);

      return await getFacturacionEntidades.executeByCentro({
        inicio,
        final,
        centroId,
        terceroId,
        byDay,
        context,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
