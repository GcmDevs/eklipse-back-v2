import { FacturacionPeriodoModel, FacturacionRepository } from '../../domain';

export class GetFacturacionPeriodo {
  constructor(private _facturacion: FacturacionRepository) {}

  public execute(inicio: Date, final: Date): Promise<FacturacionPeriodoModel> {
    return this._facturacion.getFacturacionPeriodo(inicio, final);
  }
}
