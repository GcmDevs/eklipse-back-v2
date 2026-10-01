import { GcmContexts } from '@common/application/constants';
import { FacturacionTerceroMesModel, FacturacionRepository } from '../../domain';

export class GetFacturacionEntidades {
  constructor(private _facturacion: FacturacionRepository) {}

  public execute(
    inicio: Date,
    final: Date,
    centroId: number,
    terceroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    return this._facturacion.getFacturacionEntidades(inicio, final, centroId, terceroId, byDay);
  }

  public executeByCentro(payload: {
    inicio: Date;
    final: Date;
    centroId: number;
    terceroId: number;
    byDay: boolean;
    context: GcmContexts;
  }): Promise<FacturacionTerceroMesModel[]> {
    const { inicio, final, centroId, terceroId, byDay, context } = payload;
    return this._facturacion.getFacturacionEntidadesByCentro({
      inicio,
      final,
      centroId,
      terceroId,
      byDay,
      context,
    });
  }
}
