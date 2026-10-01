import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { EvolucionesResponse } from '../responses';
import { getEvolucionesByPaciente } from '../queries';

export class EvolucionesSourceRepository extends BaseSource {
  public async evolucionesPaciente(
    ctx: GcmContexts,
    consecutivo: number
  ): Promise<EvolucionesResponse[]> {
    const qr = this.dynamicConn(gcmContextFactory(ctx));

    const result: EvolucionesResponse[] = await qr.query(getEvolucionesByPaciente(consecutivo));

    return result;
  }
}
