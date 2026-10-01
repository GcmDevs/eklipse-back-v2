import { BadRequestException, Injectable } from '@nestjs/common';
import { ProcedimientosSourceRepository } from '../../insfrastructure/repositories';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class ProcedimientosHandler {
  constructor(private _procedimientos: ProcedimientosSourceRepository) {}
  public async getProcedimientos(ctx: GcmContexts, consecutivo: number) {
    try {
      const result = await this._procedimientos.getProcedimientos(ctx, consecutivo);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
