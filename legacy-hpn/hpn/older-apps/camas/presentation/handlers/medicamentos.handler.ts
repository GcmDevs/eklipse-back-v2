import { BadRequestException, Injectable } from '@nestjs/common';
import { MedicamentosSourceRepository } from '../../insfrastructure/repositories';
import { GcmContexts } from '@common/application/constants';
import { MedicamentosResponse } from '../../insfrastructure/responses';

@Injectable()
export class MedicamentosHandler {
  constructor(private _medicamentos: MedicamentosSourceRepository) {}

  public async getMedicamentos(
    ctx: GcmContexts,
    consecutivo: number
  ): Promise<MedicamentosResponse[]> {
    try {
      const result = await this._medicamentos.getMedicamentos(ctx, consecutivo);
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
