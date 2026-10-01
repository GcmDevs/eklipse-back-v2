import { Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { DocumentoVistoControlGastosPayload } from '@farmacia/control-gastos/application/payloads';
import { BaseSource } from '@common/infrastructure/services';
import { ControlGastoOrm } from '@orm/inn/farmacia/control-gastos';

@Injectable()
export class DocumentoVistoControlGastoImpl extends BaseSource {
  public async execute(payload: DocumentoVistoControlGastosPayload) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);

      // let controlGasto = new ControlGastoOrm();
      const controlGasto = await controlGastoRp.findOne({
        where: { id: payload.idControlGasto },
      });

      // if (!payload.idControlGasto) {
      //   controlGasto = await controlGastoRp.findOne({
      //     where: { ordenDespachoId: payload.suministroPacienteId },
      //   });
      // } else {
      //   controlGasto = await controlGastoRp.findOne({
      //     where: { id: payload.idControlGasto },
      //   });
      // }

      if (!controlGasto) throw new Error('No existe control de gastos con este id');

      controlGasto.hasVisto = true;

      await controlGastoRp.save(controlGasto);

      await qr.commitTransaction();

      return true;
    } catch (error) {
      await qr.rollbackTransaction();

      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
