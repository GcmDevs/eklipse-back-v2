import { FacturacionRepository, FacturacionTerceroMesModel } from '../../domain';

export class GetFacturacionTerceros {
  constructor(private _facturacion: FacturacionRepository) {}

  public execute(
    inicio: Date,
    final: Date,
    centroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    return this._facturacion.getFacturacionTerceros(inicio, final, centroId, byDay);
  }

  public executeByCentro(
    inicio: Date,
    final: Date,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    return this._facturacion.getFacturacionTercerosByCentro(inicio, final, byDay);
  }
}
