import { GcmContexts } from '@common/application/constants';
import { BadRequestException, Injectable } from '@nestjs/common';
import { LaboratorioSourceRepository } from '../../insfrastructure/repositories/laboratorio.source';

@Injectable()
export class LaboratorioHandler {
  constructor(private _laboratorio: LaboratorioSourceRepository) {}
  getExamenes(ctx: GcmContexts, id: number) {
    try {
      return this._laboratorio.getExamenes(ctx, id);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  // getInterconsultas(ctx: GcmContexts, documento: number) {
  //   try {
  //     return this._laboratorio.getInterconsultas(ctx, documento);
  //   } catch (error) {
  //     throw new Error(error.message);
  //   }
  // }
}
