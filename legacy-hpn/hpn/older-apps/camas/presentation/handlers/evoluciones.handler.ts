import { BadRequestException, Injectable } from '@nestjs/common';
import { EvolucionesSourceRepository } from '../../insfrastructure/repositories/evoluciones.source';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class EvoluionesHandler {
  public constructor(private _evolucionesRepository: EvolucionesSourceRepository) {}
  public async execute(ctx: GcmContexts, consecutivo: number): Promise<any> {
    try {
      const result = await this._evolucionesRepository.evolucionesPaciente(ctx, consecutivo);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
