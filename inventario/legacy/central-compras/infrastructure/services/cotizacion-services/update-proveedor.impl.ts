import { BadRequestException, Injectable } from '@nestjs/common';
import { CotizacionOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { GcmContexts } from '@common/domain/types';
import { gcmContextFactory } from '@common/domain/types';
import { CentralComprasSource } from '../../base';
import { ProveedorOrm } from '@inn/lgc/ctc/orm/gen';

@Injectable()
export class UpdateProveedorCotizacionImpl extends CentralComprasSource {
  public async execute(contextCode: GcmContexts, cotizacionId: number, proveedorId: number) {
    const ds = this.dynamicConn(gcmContextFactory(contextCode));
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
    } catch (error: any) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
