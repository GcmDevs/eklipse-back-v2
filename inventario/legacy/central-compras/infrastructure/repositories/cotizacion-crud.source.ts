import { Injectable } from '@nestjs/common';
import { CreateCotizacionDto } from '@inn/lgc/ctc/presentation/dtos';
import { CreateCotizacionImpl } from './cotizacion-crud/create.impl';

@Injectable()
export class CotizacionCrudSource {
  constructor(private _create: CreateCotizacionImpl) {}

  public async create(payload: CreateCotizacionDto) {
    return await this._create.execute(payload);
  }
}
