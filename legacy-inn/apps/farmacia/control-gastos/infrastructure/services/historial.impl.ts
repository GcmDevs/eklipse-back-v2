import { GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { ControlGastoHistorialOrm } from '@orm/inn/farmacia/control-gastos';

@Injectable()
export class HistorialGastoImpl extends BaseSource {
  public async execute(ctx: GcmContextType) {
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);

      const historial = await historialRp.find();

      return historial;
    } catch (error) {
      await qr.rollbackTransaction();

      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
