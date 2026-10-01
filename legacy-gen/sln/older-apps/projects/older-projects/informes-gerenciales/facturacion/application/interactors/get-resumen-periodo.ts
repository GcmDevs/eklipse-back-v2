import {
  FacturacionRepository,
  ResumenPeriodoEntidadesModel,
  ResumenPeriodoModel,
} from '../../domain';

export class GetResumenPeriodo {
  constructor(private _facturacion: FacturacionRepository) {}

  public execute(inicio: Date, final: Date, centroId: number): Promise<ResumenPeriodoModel[]> {
    return this._facturacion.getResumenPeriodo(inicio, final, centroId);
  }

  public porEntidades(inicio: Date, final: Date): Promise<ResumenPeriodoEntidadesModel[]> {
    return this._facturacion.getResumenPeriodoPorEntidad(inicio, final);
  }
}
