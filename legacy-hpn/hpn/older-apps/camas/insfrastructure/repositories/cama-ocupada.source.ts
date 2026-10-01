import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { fetchCamasOcupadasQuery } from '../queries';
import { CamaOcupadaResponse } from '../responses';
import { CamaOcupadaDto } from '../../application/dtos';
import { transformCamaOcupada } from '../factories';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class CamaOcupadaSourceRepository extends BaseSource {
  public async fetchCamasOcupadas(ctx: GcmContexts, codigo: string): Promise<CamaOcupadaDto> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));

    try {
      await qr.connect();
      const result: CamaOcupadaResponse[] = await qr.query(fetchCamasOcupadasQuery(codigo));

      const data = transformCamaOcupada(result);

      return data;
    } finally {
      await qr.release();
    }
  }
}
