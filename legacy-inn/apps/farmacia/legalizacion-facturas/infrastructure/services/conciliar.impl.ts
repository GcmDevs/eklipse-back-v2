import { Injectable } from '@nestjs/common';

import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';

import { GenerateReporteLegalizacionFacturaPayoad } from '@farmacia/legalizacion-facturas/application/payloads';

import {
  LegalizacionFacturaHistorialOrm,
  LegalizacionFacturaOrm,
} from '@orm/inn/farmacia/legalizacion-factura';

@Injectable()
export class ConciliarLegalizacionFacturaImpl extends BaseSource {
  public async execute(payload: GenerateReporteLegalizacionFacturaPayoad) {
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

      const ahora = new Date();
      legalizacionFact.estadoCode = payload.estadoCode;

      const historial = new LegalizacionFacturaHistorialOrm();
      historial.legalizacionFactId = legalizacionFact.id;
      historial.estadoCode = payload.estadoCode;
      historial.fechaCambio = ahora;
      historial.usuarioId = this.auth.id;
      historial.sedeId = legalizacionFact.sedeId;
      historial.observacion = payload.observacion ? payload.observacion : null;

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
