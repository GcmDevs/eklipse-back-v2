import { Injectable } from '@nestjs/common';
import { MarcarPrealtaSourceRepository } from '../../insfrastructure/repositories/marcar-prealta.source';
import { PrealtaDto } from '../../application/dtos';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class MarcarPrealtaHandler {
  constructor(private _marcarPrealta: MarcarPrealtaSourceRepository) {}
  public async execute(ctx: GcmContexts, body: PrealtaDto) {
    try {
      const result = await this._marcarPrealta.marcarPrealta(ctx, body);
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  public async getPrealtaById(ctx: GcmContexts, id: number) {
    try {
      const result = await this._marcarPrealta.getPrealtaById(ctx, id);
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async cancelarPrealta(ctx: GcmContexts, id: number) {
    try {
      const result = await this._marcarPrealta.cancelarPrealta(ctx, id);
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  public async getAllPrealta(ctx: GcmContexts) {
    try {
      const result = await this._marcarPrealta.getAllPrealta(ctx);
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
