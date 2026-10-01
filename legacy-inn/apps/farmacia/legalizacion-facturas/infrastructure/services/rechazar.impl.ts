import { Injectable } from '@nestjs/common';

import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';

import { RechazarLegalizacionFacturaPayload } from '@farmacia/legalizacion-facturas/application/payloads';

import {
  LegalizacionFacturaHistorialOrm,
  LegalizacionFacturaOrm,
} from '@orm/inn/farmacia/legalizacion-factura';
import { ESTADOS_CONTROL_GASTO } from '@ctypes/inn/farmacia/control-gastos';

@Injectable()
export class RechazarLegalizacionFacturaImpl extends BaseSource {
  public async execute(payload: RechazarLegalizacionFacturaPayload) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const legalizacionFactRp = qr.manager.getRepository(LegalizacionFacturaOrm);
      const historialRp = qr.manager.getRepository(LegalizacionFacturaHistorialOrm);

      const legalizacionFact = await legalizacionFactRp.findOne({
        where: { id: payload.legalizacionFactId },
      });

      if (!legalizacionFact) {
        throw new Error('No existe solicitud de legalización de factura con este id');
      }

      const ESTADO_RECHAZADO = ESTADOS_CONTROL_GASTO.RECHAZADO.getCode();

      legalizacionFact.estadoCode = ESTADO_RECHAZADO;
      legalizacionFact.obervacionRechazo = payload.observacionRechazo;
      legalizacionFact.isDocumentoRechazado = true;

      const historial = new LegalizacionFacturaHistorialOrm();
      historial.legalizacionFactId = legalizacionFact.id;
      historial.estadoCode = ESTADO_RECHAZADO;
      historial.fechaCambio = new Date();
      historial.usuarioId = this.auth.id;
      historial.observacion = payload.observacionRechazo;
      historial.sedeId = legalizacionFact.sedeId;

      await historialRp.save(historial);

      await legalizacionFactRp.save(legalizacionFact);

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
