import { FacturaRepository } from '../domain';

export class FetchServiciosByConsecutivo {
  constructor(private _facturas: FacturaRepository) {}

  public execute(consecutivo: number, codigosContratos: string[]): Promise<any> {
    return this._facturas.fetchServiciosByConsecutivo(consecutivo, codigosContratos);
  }
}
