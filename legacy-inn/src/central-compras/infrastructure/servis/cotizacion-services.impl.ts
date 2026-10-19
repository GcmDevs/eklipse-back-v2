import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../base';
import { GcmContexts } from '@common/application/constants';
import { CotizacionOrm, SolicitudOrm } from '@orm/inn/central-compras';
import { ProveedorOrm } from '@orm/gen';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class CotizacionServicesImpl extends CentralComprasSource {
  public async updateProveedor(context: GcmContexts, cotizacionId: number, proveedorId: number) {
    const ds = this.dynamicConn(gcmContextFactory(context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const proveedorRp = localQr.manager.getRepository(ProveedorOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: cotizacionId },
      });

      const solicitud = await solicitudRp.findOneOrFail({ where: { id: cotizacion.solicitudId } });
      const proveedor = await proveedorRp.findOneOrFail({ where: { id: proveedorId } });

      if (solicitud.wasRejected()) {
        throw new Error('Esta solicitud ya fue rechazada');
      }

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      if (cotizacion.cotDocumentoId) {
        throw new Error(`Esta cotización ya tiene  ${kwTO.tipoOrden}`);
      }

      cotizacion.proveedorId = proveedor.id;
      await cotizacionRp.save(cotizacion);

      await localQr.commitTransaction();

      return true;
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
