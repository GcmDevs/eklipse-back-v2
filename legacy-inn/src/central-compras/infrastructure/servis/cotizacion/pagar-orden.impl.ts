import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource, TimerService } from '../../base';
import { orderBy } from 'lodash';
import { In, Not } from 'typeorm';
import { FILE_LOCATIONS, IVA } from '@common/application/constants';
import { OldPagarOrdenDto } from '@inn/central-compras/presentation/dtos';
import {
  CotizacionOrm,
  DetalleCotizacionOrm,
  PagoOrm,
  SolicitudOrm,
} from '@orm/inn/central-compras';
import { deleteFile } from '@common/presentation/helpers';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { TIPOS_PAGO } from '@ctypes/inn/central-compras/cotizaciones';
import { gcmContextFactory } from '@common/domain/types';
import { UsuarioOrm } from '@orm/gen';

@Injectable()
export class PagarOrdenImpl extends CentralComprasSource {
  public async execute(payload: OldPagarOrdenDto) {
    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      const maxVariableValor = 100;
      const minVariableValor = -100;

      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const detCotizacionRp = localQr.manager.getRepository(DetalleCotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);
      const userRp = localQr.manager.getRepository(UsuarioOrm);

      const userFromDb = await userRp.findOne({
        where: { cedula: this.auth.user.document },
      });

      if (!userFromDb) {
        throw new Error(
          `Su usuario no existe en ${gcmContextFactory(payload.context).getForHumans()}`
        );
      }

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      if (cotizacion.tipoPagoCode === TIPOS_PAGO.A_CREDITO.getCode()) {
        throw new Error('No es necesario agregar soporte de pago en los creditos');
      }

      const cotizaciones = await cotizacionRp.find({
        where: { id: Not(In([payload.cotizacionId])), solicitudId: cotizacion.solicitudId },
      });

      const solicitud = await solicitudRp.findOneOrFail({
        where: { id: cotizacion.solicitudId },
        relations: ['detalle'],
      });

      if (solicitud.wasRejected()) throw new Error('Esta solicitud ya fue rechazada');

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      const pagos = await pagoRp.find({
        where: solicitud.isPagoPorCajaMenor
          ? { cotizacionId: cotizacion.id }
          : { cotizacionId: cotizacion.id, cotDocumentoId: cotizacion.cotDocumentoId },
      });

      const pagosPendientes = pagos.filter(
        el => el.estadoAlPagarId === null && el.fechaProgramacion !== null
      );
      const pagosRealizados = pagos.filter(el => el.estadoAlPagarId !== null);
      const isUltimoPago = pagos.length - pagosRealizados.length === 1;

      if (pagosRealizados.length) {
        throw new Error(
          `Solo se requiere pagar el primer pago en CREDIANTICIPO o el unico pago en ANTICIPO`
        );
      }
      if (!pagosPendientes.length) {
        throw new Error(`Esta orden de ${kwTO.tipoOrden} no tiene ningún pago pendiente`);
      }

      const newPago = orderBy(pagosPendientes, 'id', 'asc')[0];

      const timer = new TimerService();
      if (new Date() < newPago.fechaProgramacion) {
        throw new Error(
          `No puede programar este pago antes de ${timer.formatDate(newPago.fechaProgramacion, 3)}`
        );
      }

      const diffInPagos = payload.valorPagado - newPago.valor;

      if (
        (diffInPagos < minVariableValor || diffInPagos > maxVariableValor) &&
        !solicitud.isPagoPorCajaMenorExpress
      ) {
        throw new Error(`El pago difiere en mas de $${maxVariableValor}`);
      }

      if (solicitud.isPagoPorCajaMenorExpress) {
        const valuePerItem =
          (payload.valorPagado * payload.valorPagado) /
          ((payload.valorPagado / 100) * (100 + IVA)) /
          solicitud.detalle.length;

        cotizacion.detalle.map(el => {
          el.valorUnitario = valuePerItem / el.item.cantidad;
        });
      }

      newPago.valor = payload.valorPagado;

      await detCotizacionRp.save(cotizacion.detalle);

      if (!cotizacion.cotDocumentoId && !solicitud.isPagoPorCajaMenor) {
        throw new Error(`Esta cotización no tiene ninguna orden de ${kwTO.tipoOrden} agregada`);
      }

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode: isUltimoPago
          ? ESTADOS_ESPECIFICOS.COTI_OC_PAGO_FINAL.getCode()
          : ESTADOS_ESPECIFICOS.COTI_OC_ABONO.getCode(),
        estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `Pago a ${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} realizado${
          payload.observaciones ? `. ${payload.observaciones}` : ''
        }`,
        archivoRelacionado: payload.fileName,
      });

      newPago.estadoAlPagarId = estado.id;
      const pagoStored = await pagoRp.save(newPago);

      cotizacion.pagada = true;
      cotizacion.recibida = true;
      cotizacion.listaParaEntrega = true;
      solicitud.isFinished = true;

      cotizaciones.forEach(c => {
        if (c.isActiva === true) {
          if (c.id !== cotizacion.id) {
            if (!c.pagada) solicitud.isFinished = false;
          } else if (!cotizacion.pagada) solicitud.isFinished = false;
        }
      });

      await solicitudRp.save(solicitud);
      await cotizacionRp.save(cotizacion);

      await localQr.commitTransaction();

      return { estado, pago: pagoStored };
    } catch (error) {
      await localQr.rollbackTransaction();
      deleteFile(`${FILE_LOCATIONS.inn.ctc.comprobantesPago}/${payload.fileName}`);
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
