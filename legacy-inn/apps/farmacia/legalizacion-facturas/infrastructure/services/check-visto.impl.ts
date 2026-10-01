import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { DocumentoVistoLegalizacionFacturaPayload } from '@farmacia/legalizacion-facturas/application/payloads';
import { Injectable } from '@nestjs/common';
import { LegalizacionFacturaOrm } from '@orm/inn/farmacia/legalizacion-factura';

@Injectable()
export class CheckVistoLegalizacionFacturaImpl extends BaseSource {
  public async execute(payload: DocumentoVistoLegalizacionFacturaPayload) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const legalizacionFactRp = qr.manager.getRepository(LegalizacionFacturaOrm);

      const legalizacionFact = await legalizacionFactRp.findOne({
        where: { id: payload.legalizacionFactId },
      });

      if (!legalizacionFact) {
        throw new Error('No existe solicitud de legalización de factura con este id');
      }

      legalizacionFact.hasVisto = payload.hasVisto;

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
