import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadisticasCamaSourceRepository } from '../../insfrastructure/repositories';
import { EstadisticasCamaDto } from '../../application/dtos';

@Injectable()
export class EstadisticasCamasDisponiblesHandler {
  public constructor(private _camasRepository: EstadisticasCamaSourceRepository) {}
  public async execute(allCtx: boolean): Promise<EstadisticasCamaDto[]> {
    try {
      const result = await this._camasRepository.estadisticasCama(allCtx);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
