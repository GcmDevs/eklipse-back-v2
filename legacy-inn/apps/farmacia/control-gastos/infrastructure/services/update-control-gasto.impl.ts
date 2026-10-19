import { Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { ControlGastoHistorialOrm, ControlGastoOrm } from '@orm/inn/farmacia/control-gastos';
import { UpdateControlGastoPayload } from '@farmacia/control-gastos/application/payloads';
import { ESTADOS_CONTROL_GASTO } from '@ctypes/inn/farmacia/control-gastos';

@Injectable()
export class UpdateControlGastoImpl extends BaseSource {
  public async execute(payload: UpdateControlGastoPayload) {
    const { idControlGasto, contextCode, facturaFileName, isEps } = payload;

    const ctx = gcmContextFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();
      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);
      const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);

      const controlGasto = await controlGastoRp.findOne({
        where: { id: idControlGasto },
      });

      if (!controlGasto) {
        throw new Error('No existe reporte de control de gastos con este id');
      }
      // if (!facturaFileName) throw new Error('Debe enviar archivo de la factura');

      const estadoCode = isEps
        ? ESTADOS_CONTROL_GASTO.FINALIZADO.getCode()
        : ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();

      controlGasto.documentoAdjuntoLink = facturaFileName;
      controlGasto.estadoCode = estadoCode;
      await controlGastoRp.save(controlGasto);

      const historial = new ControlGastoHistorialOrm();

      historial.controlGastoId = controlGasto.id;
      historial.estadoCode = estadoCode;
      historial.fechaCambio = new Date();
      historial.usuarioId = this.auth.id;
      historial.facturaLink = facturaFileName;
      historial.observacion = payload.observacionSolicitud;

      await historialRp.save(historial);
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
