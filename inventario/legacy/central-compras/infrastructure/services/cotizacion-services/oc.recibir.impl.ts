import { Not } from 'typeorm';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { RecibirOrdenCompraDto } from '@inn/lgc/ctc/presentation/dtos';
import { CotizacionOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { BadRequestException, Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { CentralComprasSource } from '../../base';

@Injectable()
export class RecibirOrdenCompraImpl extends CentralComprasSource {
  public async execute(payload: RecibirOrdenCompraDto) {
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    await qr.connect();
    try {
      await qr.startTransaction();
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);

      const cotizacion = await cotizacionRp.findOne({ where: { id: payload.cotizacionId } });
      if (!cotizacion) throw new Error('No se encontró la cotización');
      if (!cotizacion.cotDocumentoId) throw new Error(`No hay orden agregada`);

      const solicitud = await solicitudRp.findOne({
        where: { id: cotizacion.solicitudId },
        relations: ['usuario'],
      });

      if (solicitud.wasRejected()) throw new Error('Esta solicitud ya fue rechazada');

      const isSameUser = solicitud.usuario.cedula !== this.auth.user.document;
      if (isSameUser) throw new Error('Solo el solicitante puede recibir los productos');

      await this.createCambioEstado(qr, {
        solicitud,
        estadoEspecifico: payload.isAprobado
          ? ESTADOS_ESPECIFICOS.COTI_PRODUCTOS_RECIBIDOS
          : ESTADOS_ESPECIFICOS.COTI_PRODUCTOS_NO_RECIBIDOS,
        estado: ESTADOS.SOL_ULTIMOS_PASOS,
        informacionAdicional: payload.observaciones,
        entidadRelacionadaId: cotizacion.id,
      });

      cotizacion.recibida = payload.isAprobado;

      await cotizacionRp.save(cotizacion);

      solicitud.isFinished = true;

      const otrasCotizaciones = await cotizacionRp.find({
        where: {
          id: Not(payload.cotizacionId),
          solicitudId: cotizacion.solicitudId,
          isActiva: true,
        },
        select: { id: true, isActiva: true, recibida: true },
      });

      otrasCotizaciones.forEach(c => {
        if (!c.pagada) solicitud.isFinished = false;
      });

      await solicitudRp.save(solicitud);

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
