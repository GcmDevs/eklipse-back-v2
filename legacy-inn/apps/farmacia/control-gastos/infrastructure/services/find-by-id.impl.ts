import { Injectable } from '@nestjs/common';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { ControlGastoOrm } from '@orm/inn/farmacia/control-gastos';

@Injectable()
export class FindByIdControlGastoImpl extends BaseSource {
  public async execute(id: number, contextCode: GcmContextCode) {
    const ctx = gcmContextFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);

      const controlGasto = await controlGastoRp.findOne({
        where: { id },
        relations: ['detalle'],
      });

      if (!controlGasto) {
        throw new Error('No existe reporte de control de gastos con este id');
      }

      return controlGasto;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
