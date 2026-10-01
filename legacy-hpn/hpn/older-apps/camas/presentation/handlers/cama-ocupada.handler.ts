import { BadRequestException, Injectable } from '@nestjs/common';
import { CamaOcupadaSourceRepository } from '../../insfrastructure/repositories';
import { CamaOcupadaDto } from '../../application/dtos';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class CamaOcupadaHandler {
  constructor(private _camaOcupada: CamaOcupadaSourceRepository) {}

  public async execute(ctx: GcmContexts, codigo: string): Promise<CamaOcupadaDto> {
    try {
      const result = await this._camaOcupada.fetchCamasOcupadas(ctx, codigo);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
