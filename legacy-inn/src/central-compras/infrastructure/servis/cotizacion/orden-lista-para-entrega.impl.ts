import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../../base';
import { OldOrdenListaDto } from '@inn/central-compras/presentation/dtos';
import { CotizacionOrm, SolicitudOrm } from '@orm/inn/central-compras';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class OrdenListaParaEntregaImpl extends CentralComprasSource {
  public async execute(payload: OldOrdenListaDto) {
    const localQr = this.dynamicQR(gcmContextFactory(payload.context));
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
      });

      const solicitud = await solicitudRp.findOneOrFail({ where: { id: cotizacion.solicitudId } });

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      if (solicitud.wasRejected()) {
        throw new Error('Esta solicitud ya fue rechazada');
      }

      if (!cotizacion.cotDocumentoId) {
        throw new Error(`Esta cotización no tiene ninguna orden de ${kwTO.tipoOrden} agregada`);
      }

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.COTI_LISTA_PARA_ENTREGA.getCode(),
        estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: payload.observaciones,
      });

      cotizacion.listaParaEntrega = true;
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
