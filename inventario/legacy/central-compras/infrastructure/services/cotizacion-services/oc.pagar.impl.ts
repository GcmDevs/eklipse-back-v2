import { orderBy } from 'lodash';
import { Not } from 'typeorm';
import { CentralComprasSource, TimerService } from '../../base';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PagarOrdenCompraDto } from '@inn/lgc/ctc/presentation/dtos';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CTC_FILE_LOCATIONS, IVA, VERIFICAR_VALORES } from '@inn/lgc/ctc/application/constants';
import { TIPOS_PAGO } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { deleteFile } from '@common/presentation/helpers';
import { gcmContextFactory } from '@common/domain/types';
import { UsuarioOrm } from '@inn/lgc/ctc/orm/gen';
import {
  DetalleCotizacionOrm,
  CotizacionOrm,
  SolicitudOrm,
  PagoOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';

@Injectable()
export class PagarOrdenCompraImpl extends CentralComprasSource {
  public async execute(payload: PagarOrdenCompraDto) {
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    await qr.connect();
    try {
      const maxVariableValor = 100;
      const minVariableValor = -100;

      await qr.startTransaction();
      const detCotizacionRp = qr.manager.getRepository(DetalleCotizacionOrm);
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);
      const pagoRp = qr.manager.getRepository(PagoOrm);

      const userFromDb = await usuarioRp.findOne({
        where: { cedula: this.auth.user.document },
      });

      if (!userFromDb) {
        throw new Error(
          `Su usuario no existe en ${gcmContextFactory(payload.contextCode).getForHumans()}`
        );
      }

      const cotizacion = await cotizacionRp.findOne({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      if (!cotizacion) throw new Error('No se encontró cotización');

      const otrasCotizaciones = await cotizacionRp.find({
        where: {
          id: Not(payload.cotizacionId),
          solicitudId: cotizacion.solicitudId,
          isActiva: true,
        },
        select: { id: true, isActiva: true, recibida: true },
      });

      if (cotizacion.tipoPagoCode === TIPOS_PAGO.A_CREDITO.getCode()) {
        throw new Error('No es necesario agregar soporte de pago en los creditos');
      }

      const solicitud = await solicitudRp.findOne({
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
        !solicitud.isPagoPorCajaMenorExpress &&
        VERIFICAR_VALORES
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

      const estado = await this.createCambioEstado(qr, {
        estadoEspecifico: isUltimoPago
          ? ESTADOS_ESPECIFICOS.COTI_OC_PAGO_FINAL
          : ESTADOS_ESPECIFICOS.COTI_OC_ABONO,
        estado: ESTADOS.SOL_ULTIMOS_PASOS,
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `Pago a ${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} realizado${
          payload.observaciones ? `. ${payload.observaciones}` : ''
        }`,
        archivoRelacionado: payload.fileName,
      });

      newPago.estadoAlPagarId = estado.id;

      cotizacion.pagada = true;
      cotizacion.listaParaEntrega = true;
      cotizacion.recibida = true;
      await cotizacionRp.save(cotizacion);

      solicitud.isFinished = true;

      otrasCotizaciones.forEach(c => {
        if (!c.pagada) solicitud.isFinished = false;
      });

      await solicitudRp.save(solicitud);

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      deleteFile(`${CTC_FILE_LOCATIONS.comprobantesPago}/${payload.fileName}`);
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
