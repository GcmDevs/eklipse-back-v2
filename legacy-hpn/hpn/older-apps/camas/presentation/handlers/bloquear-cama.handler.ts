import { GcmContexts } from '@common/application/constants';
import { Injectable, BadRequestException } from '@nestjs/common';
import { BloquearCamaSourceRepository } from '../../insfrastructure/repositories/bloquear-cama.source';
import { BloqueoCamaDto } from '../../application/dtos';

@Injectable()
export class BloquearCamaHandler {
  constructor(private _bloquearCama: BloquearCamaSourceRepository) {}

  public async execute(ctx: GcmContexts, bloqueo: BloqueoCamaDto): Promise<boolean> {
    try {
      const result = await this._bloquearCama.bloquearCama(ctx, bloqueo);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async getMotivos(ctx: GcmContexts, id: number) {
    try {
      const result = await this._bloquearCama.getMotivos(ctx, id);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
