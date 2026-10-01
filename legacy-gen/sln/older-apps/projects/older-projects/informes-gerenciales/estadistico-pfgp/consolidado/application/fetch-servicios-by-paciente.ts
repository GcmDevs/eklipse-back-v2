import { FacturaRepository } from '../domain';

export class FetchServiciosByConsecutivo {
  constructor(private _facturas: FacturaRepository) {}

  public execute(codigosContratos: string[], consecutivo: number): Promise<any> {
    return this._facturas.fetchServiciosByConsecutivo(codigosContratos, consecutivo);
  }
}
