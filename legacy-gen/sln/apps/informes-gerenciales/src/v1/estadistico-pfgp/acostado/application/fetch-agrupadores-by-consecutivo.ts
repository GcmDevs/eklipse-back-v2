import { FacturaRepository } from '../domain';

export class FetchAgrupadoresByConsecutivo {
  constructor(private _facturas: FacturaRepository) {}

  public execute(consecutivo: number, codigosContratos: string[]): Promise<any> {
    return this._facturas.fetchAgrupadoresByConsecutivo(consecutivo, codigosContratos);
  }
}
