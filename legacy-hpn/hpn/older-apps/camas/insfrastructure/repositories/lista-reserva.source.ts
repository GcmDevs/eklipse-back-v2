import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { listaReservaQuery } from '../queries';

@Injectable()
export class ListaReservaSourceRepository extends BaseSource {
  public async getListaReserva(ctx: GcmContexts) {
    const qr = this.dynamicQR(gcmContextFactory(ctx));
    try {
      await qr.connect();

      const responseQuery = await qr.query(listaReservaQuery());

      return responseQuery;
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
