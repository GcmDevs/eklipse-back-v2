import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';

import { CargarFacturaLegalizacionFacturaPayload } from '@farmacia/legalizacion-facturas/application/payloads';
import { gcmContextFactory } from '@common/domain/types';
import {
  LegalizacionFacturaHistorialOrm,
  LegalizacionFacturaOrm,
} from '@orm/inn/farmacia/legalizacion-factura';
import { ESTADOS_CONTROL_GASTO } from '@ctypes/inn/farmacia/control-gastos';
import { deleteFile } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/file-locations';

@Injectable()
export class CargarFacturaLegalizacionFacturaImpl extends BaseSource {
  public async execute(payload: CargarFacturaLegalizacionFacturaPayload) {
    const ctx = gcmContextFactory(payload.contextCode);

    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      const legalizacionFactRp = qr.manager.getRepository(LegalizacionFacturaOrm);

      const legalizacion = await legalizacionFactRp.findOne({
        where: { id: payload.legalizacionFactId },
      });

      if (!legalizacion) throw new Error('No existe legalizacion con este id');

      if (legalizacion.estadoCode === ESTADOS_CONTROL_GASTO.RECHAZADO.getCode()) {
        throw new Error('La solicitud ya fue rechazada');
      }
      if (legalizacion.estadoCode === ESTADOS_CONTROL_GASTO.FINALIZADO.getCode()) {
        throw new Error('La solicitud ya fue conciliada');
      }

      const hoy = new Date();
      const estadoAnterior = legalizacion.estadoCode;
      const facturaAnterior = legalizacion.fechaUltimaFactura;

      legalizacion.fechaUltimaFactura = hoy;

      legalizacion.factura1Link
        ? legalizacion.estadoCode
        : (legalizacion.estadoCode = ESTADOS_CONTROL_GASTO.EN_TRAMITE.getCode());
      if (legalizacion.factura1Link) {
        if (legalizacion.estadoCode !== ESTADOS_CONTROL_GASTO.PRODU_FACT.getCode()) {
          throw new Error(
            'No se puede agregar una nueva factura ya que el solicitante indicó que no hacen falta productos'
          );
        }
      }

      if (!legalizacion.factura1Link) {
        legalizacion.factura1Link = payload.facturaFileName;
      } else if (!legalizacion.factura2Link) {
        legalizacion.factura2Link = payload.facturaFileName;
      } else if (!legalizacion.factura3Link) {
        legalizacion.factura3Link = payload.facturaFileName;
      } else {
        legalizacion.fechaUltimaFactura = facturaAnterior;
        legalizacion.estadoCode = estadoAnterior;
        throw new Error('Solo se permiten 3 intentos');
      }
      if (legalizacion.estadoCode === ESTADOS_CONTROL_GASTO.PRODU_FACT.getCode()) {
        legalizacion.estadoCode = ESTADOS_CONTROL_GASTO.EN_TRAMITE.getCode();
      }

      await legalizacionFactRp.save(legalizacion);

      const historial = new LegalizacionFacturaHistorialOrm();
      historial.legalizacionFactId = legalizacion.id;
      historial.estadoCode = legalizacion.estadoCode;
      historial.fechaCambio = hoy;
      historial.usuarioId = this.auth.id;
      if (!legalizacion.factura1Link) {
        historial.facturaLink = payload.facturaFileName;
      } else if (!legalizacion.factura2Link) {
        historial.facturaLink = payload.facturaFileName;
      } else {
        historial.facturaLink = payload.facturaFileName;
      }
      historial.sedeId = legalizacion.sedeId;

      await qr.manager.save(historial);

      await qr.commitTransaction();

      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      if (payload.facturaFileName) {
        deleteFile(
          `${FILE_LOCATIONS.inn.fmc.legalizacionFacturas.facturas}/${payload.facturaFileName}`
        );
      }
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
