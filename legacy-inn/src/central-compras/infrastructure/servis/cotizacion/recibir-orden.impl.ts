import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../../base';
import { OldRecibirOrdenDto } from '@inn/central-compras/presentation/dtos';
import { CotizacionOrm, SolicitudOrm } from '@orm/inn/central-compras';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class RecibirOrdenImpl extends CentralComprasSource {
  public async execute(payload: OldRecibirOrdenDto) {
    const localQr = this.dynamicQR(gcmContextFactory(payload.context));
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
      });

      const solicitud = await solicitudRp.findOneOrFail({
        where: { id: cotizacion.solicitudId },
        relations: ['usuario'],
      });

      if (solicitud.usuario.cedula !== this.auth.user.document) {
        throw new Error(
          'Solo el usuario que realizó la solicitud puede recibir o rechazar los productos'
        );
      }

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      if (solicitud.wasRejected()) {
        throw new Error('Esta solicitud ya fue rechazada');
      }

      if (!cotizacion.cotDocumentoId) {
        throw new Error(`Esta cotización no tiene ninguna orden de ${kwTO.tipoOrden} agregada`);
      }

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode:
          payload.isAprobado === 1
            ? ESTADOS_ESPECIFICOS.COTI_PRODUCTOS_RECIBIDOS.getCode()
            : ESTADOS_ESPECIFICOS.COTI_PRODUCTOS_NO_RECIBIDOS.getCode(),
        estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: payload.observaciones,
      });

      cotizacion.recibida = payload.isAprobado === 1 ? true : false;

      await cotizacionRp.save(cotizacion);
      await localQr.commitTransaction();

      return { estado };
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
