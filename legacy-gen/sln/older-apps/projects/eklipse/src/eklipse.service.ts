import { BadRequestException, Injectable } from '@nestjs/common';
import { EklCentroOrm } from './orm';
import { BaseSource } from '@sln/old/common/infrastructure/bases';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class EklipseService extends BaseSource {
  async fetchCentros() {
    try {
      const eklQr = this.dynamicQR(GcmContexts.EKLIPSE);
      await eklQr.connect();
      const centroRp = eklQr.manager.getRepository(EklCentroOrm);
      const centros = await centroRp.find();

      return centros;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
