import { FacturaRepository } from '../domain';

export class FetchEstanciasByConsecutivo {
  constructor(private _facturas: FacturaRepository) {}

  public execute(consecutivo: number): Promise<any> {
    return this._facturas.fetchEstanciasByConsecutivo(consecutivo);
  }
}
