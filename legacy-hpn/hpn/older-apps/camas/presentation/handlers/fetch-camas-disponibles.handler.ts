import { BadRequestException, Injectable } from '@nestjs/common';
import { CamaSourceRepository } from '../../insfrastructure/repositories';
import { CamaDto } from '../../application/dtos';

@Injectable()
export class FetchCamasDisponiblesHandler {
  constructor(private _camas: CamaSourceRepository) {}

  public async execute(allCtx: boolean): Promise<CamaDto[]> {
    try {
      const result = await this._camas.fetchDisponibles(allCtx);

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
