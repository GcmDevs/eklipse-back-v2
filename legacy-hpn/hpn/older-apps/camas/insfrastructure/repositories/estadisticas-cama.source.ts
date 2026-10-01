import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { allContexts } from 'hpn/older-apps/constants';
import { fetchCamasQuery } from '../queries';
import { EstadisticasCamaDto } from '../../application/dtos';
import { transformEstadisticas } from '../factories';

export class EstadisticasCamaSourceRepository extends BaseSource {
  public async estadisticasCama(allCtx: boolean): Promise<EstadisticasCamaDto[]> {
    const CONTEXTS = allCtx ? allContexts([GcmContexts.AMMEDICAL]) : [this.auth.context.getCode()];

    const resultadoLocal: EstadisticasCamaDto[] = [];

    for (let i = 0; i < CONTEXTS.length; i++) {
      const qr = this.dynamicQR(gcmContextFactory(CONTEXTS[i]));

      try {
        await qr.connect();
        const result = await qr.query(fetchCamasQuery());

        const response = transformEstadisticas(result);

        resultadoLocal.push(...response);
      } finally {
        await qr.release();
      }
    }
    return resultadoLocal;
  }
}
