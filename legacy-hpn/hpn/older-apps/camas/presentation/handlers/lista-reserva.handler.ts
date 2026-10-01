import { GcmContexts } from '@common/application/constants';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ListaReservaSourceRepository } from '../../insfrastructure/repositories/lista-reserva.source';

@Injectable()
export class ListaReservaHandler {
  constructor(private _listaReserva: ListaReservaSourceRepository) {}
  public async getListaEsperaRerencia(ctx: GcmContexts) {
    try {
      const result = await this._listaReserva.getListaReserva(ctx);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
