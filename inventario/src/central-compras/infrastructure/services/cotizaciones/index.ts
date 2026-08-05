import { Injectable } from '@nestjs/common';
import { AddOCImpl } from './add-orden-compra.impl';
import { AddOCDto } from '@inn/central-compras/presentation/dtos/cotizaciones';

export * from './add-orden-compra.impl';

@Injectable()
export class CotizacionServicesSource {
  constructor(private _agregarOC: AddOCImpl) {}

  public async agregarOC(payload: AddOCDto) {
    return await this._agregarOC.execute(payload);
  }
}
