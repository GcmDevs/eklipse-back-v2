import { GcmContexts } from '@common/application/constants';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ListaEsperaCamaReferenciaSourceRepository } from '../../insfrastructure/repositories';

@Injectable()
export class ListaEsperaCamaReferenciaHandler {
  constructor(private _listaEspera: ListaEsperaCamaReferenciaSourceRepository) {}
  public async getListaEsperaRerencia(ctx: GcmContexts) {
    try {
      const result = await this._listaEspera.getListaEsperaReferencia(ctx);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
