import { Injectable } from '@nestjs/common';

import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { ESTADOS_CONTROL_GASTO } from '@ctypes/inn/farmacia/control-gastos';
import { deleteFile } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { CreateLegalizacionFacturasPayload } from '@farmacia/legalizacion-facturas/application/payloads';
import {
  LegalizacionFacturaHistorialOrm,
  LegalizacionFacturaOrm,
} from '@orm/inn/farmacia/legalizacion-factura';

@Injectable()
export class CreateLegalizacionFacturasImpl extends BaseSource {
  public async execute(body: CreateLegalizacionFacturasPayload) {
    const ctx = gcmContextFactory(body.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      if (!body.documentoFileName) throw new Error('Debe enviar el documento');
      if (!body.numeroFactura) throw new Error('No se encontro el numero de factura');

      const legalizacionFactRp = qr.manager.getRepository(LegalizacionFacturaOrm);
      const legalizacionFactHistRp = qr.manager.getRepository(LegalizacionFacturaHistorialOrm);

      const hoy = new Date();

      const newLegalizacionFact = new LegalizacionFacturaOrm();
      newLegalizacionFact.estadoCode = ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();
      newLegalizacionFact.fechaCreacion = hoy;
      newLegalizacionFact.numeroFactura = body.numeroFactura;
      newLegalizacionFact.documentoAdjuntoLink = body.documentoFileName;
      newLegalizacionFact.creadoPorId = this.auth.id;
      newLegalizacionFact.sedeId = body.sedeId;

      const legalizacionFactStored = await legalizacionFactRp.save(newLegalizacionFact);

      const historial = new LegalizacionFacturaHistorialOrm();
      historial.legalizacionFactId = legalizacionFactStored.id;
      historial.estadoCode = ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();
      historial.fechaCambio = hoy;
      historial.usuarioId = this.auth.id;
      historial.facturaLink = body.documentoFileName;
      historial.sedeId = body.sedeId;

      await legalizacionFactHistRp.save(historial);

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      if (body.documentoFileName) {
        deleteFile(
          `${FILE_LOCATIONS.inn.fmc.controlGastos.documentoAdjunto}/${body.documentoFileName}`
        );
      }
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
