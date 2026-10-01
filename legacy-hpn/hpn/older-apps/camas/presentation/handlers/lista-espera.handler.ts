import { GcmContexts } from '@common/application/constants';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ListaEsperaCamaSourceRepository } from '../../insfrastructure/repositories';

@Injectable()
export class ListaEsperaCamaHandler {
  constructor(private _listaEspera: ListaEsperaCamaSourceRepository) {}
  public async getListaEspera(ctx: GcmContexts) {
    try {
      const result = await this._listaEspera.getListaEspera(ctx);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
