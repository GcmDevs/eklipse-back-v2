import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { RechazarDocumentoControlGastosPayload } from '@farmacia/control-gastos/application/payloads';
import { gcmContextFactory } from '@common/domain/types';
import { ControlGastoHistorialOrm, ControlGastoOrm } from '@orm/inn/farmacia/control-gastos';
import { ESTADOS_CONTROL_GASTO } from '@ctypes/inn/farmacia/control-gastos';

@Injectable()
export class RechazarDocumentoControlGastoImpl extends BaseSource {
  public async execute(payload: RechazarDocumentoControlGastosPayload) {
    const ctx = gcmContextFactory(payload.contextCode);

    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();
      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);
      const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);

      const now = new Date();
      const estadoRechazado = ESTADOS_CONTROL_GASTO.RECHAZADO.getCode();
      const controlGasto = await controlGastoRp.findOne({
        where: { id: payload.idControlGasto },
      });

      if (!controlGasto) throw new Error('No existe reporte de control de gastos con este id');

      controlGasto.isDocumentoRechazado = true;
      controlGasto.estadoCode = estadoRechazado;
      controlGasto.obervacionRechazo = payload.observacionRechazo;

      const historial = new ControlGastoHistorialOrm();
      historial.controlGastoId = controlGasto.id;
      historial.estadoCode = estadoRechazado;
      historial.fechaCambio = now;
      historial.usuarioId = this.auth.id;
      historial.observacion = payload.observacionRechazo;

      await controlGastoRp.save(controlGasto);
      await historialRp.save(historial);

      await qr.commitTransaction();

      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }
}
