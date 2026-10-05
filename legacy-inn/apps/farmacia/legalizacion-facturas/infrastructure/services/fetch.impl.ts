import { Injectable } from '@nestjs/common';
import { Between, IsNull } from 'typeorm';

import { BaseSource } from '@common/infrastructure/services';
import { LegalizacionFacturaOrm } from '@orm/inn/farmacia/legalizacion-factura';
import { ENVIRONMENTS } from 'src/app.environments';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';

@Injectable()
export class FetchLegalizacionFacturasImpl extends BaseSource {
  public async execute(fechaInicio: Date, fechaFin: Date) {
    const showAllContext = await this.hasAnyAuthority([
      INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_FACTURADOR,
    ]);

    const ctxs = showAllContext ? [GCM_CONTEXTS.ALTACENTRO] : [this.auth.context];

    for (let index = 0; index < ctxs.length; index++) {
      const el = ctxs[index];
      const qr = this.dynamicQR(el);

      try {
        await qr.connect();

        const legalizacionFactRp = qr.manager.getRepository(LegalizacionFacturaOrm);

        const legalizacionFacturas = await legalizacionFactRp.find({
          where: {
            fechaCreacion: Between(fechaInicio, fechaFin),
            sede: !IsNull(),
            isDelete: IsNull(),
          },
          relations: ['creadoPor', 'historial', 'historial.usuario', 'sede', 'historial.sede'],
          order: { fechaCreacion: 'DESC', historial: { fechaCambio: 'DESC' } },
        });

        const response = transformToResponse(legalizacionFacturas, el);

        return response;
      } catch (error) {
        throw new Error(error.message);
      } finally {
        await qr.release();
      }
    }
  }
}

const transformToResponse = (data: LegalizacionFacturaOrm[], context: GcmContextType) => {
  const baseUrl = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.fmc.legalizacionFacturas.facturas}`;
  const baseUrl2 = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.fmc.legalizacionFacturas.documentoAdjunto}`;
  const response = data.map(item => {
    return {
      id: item.id,
      contextCode: context.getCode(),
      fechaCreacion: item.fechaCreacion,
      estadoCode: item.estadoCode,
      hasVisto: item.hasVisto,
      numeroFactura: item.numeroFactura ? item.numeroFactura : null,
      isDocumentoRechazado: item.isDocumentoRechazado,
      obervacionRechazo: item.obervacionRechazo,
      fechaUltimaFactura: item.fechaUltimaFactura,
      documentoAdjuntoLink: item.documentoAdjuntoLink
        ? `${baseUrl2}/${item.documentoAdjuntoLink}`
        : null,
      documentoName: item.documentoAdjuntoLink,
      facturas: {
        factura1Link: item.factura1Link ? `${baseUrl}/${item.factura1Link}` : null,
        factura2Link: item.factura2Link ? `${baseUrl}/${item.factura2Link}` : null,
        factura3Link: item.factura3Link ? `${baseUrl}/${item.factura3Link}` : null,
        facturaName1: item.factura1Link ? item.factura1Link : null,
        facturaName2: item.factura2Link ? item.factura2Link : null,
        facturaName3: item.factura3Link ? item.factura3Link : null,
      },
      sede: item.sede,
      creadoPor: item.creadoPor,
      historial: item.historial,
    };
  });

  return response;
};
