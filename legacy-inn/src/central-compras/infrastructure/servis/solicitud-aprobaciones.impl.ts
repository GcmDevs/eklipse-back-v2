import { BadRequestException, Injectable } from '@nestjs/common';
import { IVA } from '@common/application/constants';
import { AprobacionesCotizacionesImpl } from './cotizacion-aprobaciones.impl';
import { OldAprobarSolicitudDto, OldCajaMenorExpressDto } from '../../presentation/dtos';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  DetalleCotizacionOrm,
  PagoOrm,
  SolicitudOrm,
} from '@orm/inn/central-compras';
import { PRIORIDADES, ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import {
  DIAS_PLAZO_CAJA_MENOR,
  SOLICITUDES_RECHAZADAS_ESTADOS_CODES,
} from '@inn/central-compras/application/constants';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class AprobacionesSolicitudesImpl extends AprobacionesCotizacionesImpl {
  public async cajaMenorExpress(payload: OldCajaMenorExpressDto) {
    const { solicitudId, presupuesto, context } = payload;

    const localQr = this.dynamicQR(gcmContextFactory(context));

    await localQr.connect();
    await localQr.startTransaction();
    try {
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const detCotizacionRp = localQr.manager.getRepository(DetalleCotizacionOrm);
      const cambioEstadoRp = localQr.manager.getRepository(CambioEstadoOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);

      const solicitud = await solicitudRp.findOne({
        where: { id: payload.solicitudId },
        relations: ['detalle'],
      });

      const estados = await cambioEstadoRp.find({
        where: { solicitudId },
        order: { id: 'DESC' },
      });

      const rechazos = estados.filter(
        el =>
          [
            ESTADOS.SOL_RECHAZO_TEMPORAL.getCode(),
            ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode(),
          ].indexOf(el.tipoCode) >= 0
      );

      if (rechazos.length >= 3) {
        throw new Error('La solicitud ya ha sido rechazada 3 veces, debe crear una nueva');
      }

      if (
        estados.length &&
        SOLICITUDES_RECHAZADAS_ESTADOS_CODES.indexOf(estados[0].tipoCode) >= 0
      ) {
        throw new Error('La solicitud fue rechazada previamente o no ha sido reactivada');
      }

      if (solicitud.isPagoPorCajaMenorExpress || solicitud.isPagoPorCajaMenor) {
        throw new Error('Ya se inició el proceso de caja menor para esta solicitud');
      }

      if (
        solicitud.estadoCode !== ESTADOS.SOL_REGISTRADA.getCode() &&
        solicitud.estadoCode !== ESTADOS.SOL_APROBADA.getCode()
      ) {
        throw new Error('No se puede usar caja menor express en este estado');
      }

      const newCot = new CotizacionOrm();
      newCot.solicitudId = solicitud.id;
      newCot.tipoPagoCode = 1;

      const cotStored = await cotizacionRp.save(newCot);

      const valuePerItem =
        (presupuesto * presupuesto) /
        ((presupuesto / 100) * (100 + IVA)) /
        solicitud.detalle.length;

      const newDetCot: DetalleCotizacionOrm[] = [];

      solicitud.detalle.forEach(el => {
        const detCot = new DetalleCotizacionOrm();
        detCot.IVA = IVA;
        detCot.cotizacionId = cotStored.id;
        detCot.valorUnitario = valuePerItem / el.cantidad;
        detCot.itemId = el.id;
        detCot.isAprobado = true;
        newDetCot.push(detCot);
      });

      await detCotizacionRp.save(newDetCot);

      const newPago = new PagoOrm();

      newPago.valor = payload.presupuesto;
      newPago.cotizacionId = newCot.id;
      newPago.diasPlazo = DIAS_PLAZO_CAJA_MENOR;
      newPago.pagarAlFinTrabajo = false;
      newPago.porcentaje = 100;

      pagoRp.save(newPago);

      await this.createCambioEstadoDeprecated(localQr, {
        estadoCode: ESTADOS.SOL_CAJA_MENOR_EXPRESS.getCode(),
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_CAJA_MENOR_EXPRESS.getCode(),
        solicitud,
        entidadRelacionadaId: newCot.id,
        archivoRelacionado: null,
        informacionAdicional: `ATENDIDO POR CAJA MENOR${
          payload.observacion ? ' Obs.: ' + payload.observacion : ''
        }`,
      });

      await this.createCambioEstadoDeprecated(localQr, {
        estadoCode: ESTADOS.SOL_EN_COTI.getCode(),
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_COTI_AGREGADA.getCode(),
        solicitud,
        entidadRelacionadaId: newCot.id,
        archivoRelacionado: null,
        informacionAdicional: 'PROVEEDOR TEMPORAL (PAGO CAJA MENOR)',
      });

      await this.aprobar(
        {
          context: payload.context,
          solicitudId: payload.solicitudId,
          isAprobado: true,
          observaciones: 'PAGO POR CAJA MENOR, APROBACIÓN GENERADA AUTOMATICAMENTE',
        },
        true,
        localQr
      );

      await this.aprobar(
        {
          context: payload.context,
          solicitudId: payload.solicitudId,
          isAprobado: true,
          observaciones: 'PAGO POR CAJA MENOR, APROBACIÓN GENERADA AUTOMATICAMENTE',
        },
        true,
        localQr
      );

      solicitud.prioridadCode = PRIORIDADES.CRITICA.getCode();
      solicitud.estadoCode = ESTADOS.SOL_ULTIMOS_PASOS.getCode();
      solicitud.isPagoPorCajaMenor = true;
      solicitud.isPagoPorCajaMenorExpress = true;

      await solicitudRp.save(solicitud);

      await localQr.commitTransaction();

      return true;
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }

  public async vistoBuenoInicial(body: OldAprobarSolicitudDto) {
    const { solicitudId, prioridad, isAprobado, observaciones } = body;

    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const solicitudRp = this.qr.manager.getRepository(SolicitudOrm);
      const cambioEstadoRp = this.qr.manager.getRepository(CambioEstadoOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: body.solicitudId } });

      const estados = await cambioEstadoRp.find({
        where: { solicitudId },
        order: { id: 'DESC' },
      });

      const rechazos = estados.filter(
        el => SOLICITUDES_RECHAZADAS_ESTADOS_CODES.indexOf(el.tipoCode) >= 0
      );

      const newEstadoSolicitud = isAprobado
        ? ESTADOS.SOL_APROBADA
        : rechazos.length >= 2
          ? ESTADOS.SOL_RECHAZO_DEFINITIVO
          : ESTADOS.SOL_RECHAZO_TEMPORAL;

      if (rechazos.length >= 3) {
        throw new Error('La solicitud ya ha sido rechazada 3 veces, debe crear una nueva');
      }

      if (
        estados.length &&
        SOLICITUDES_RECHAZADAS_ESTADOS_CODES.indexOf(estados[0].tipoCode) >= 0
      ) {
        throw new Error('La solicitud fue rechazada previamente o no ha sido reactivada');
      }

      if (estados.length && [ESTADOS.SOL_APROBADA.getCode()].indexOf(estados[0].tipoCode) >= 0) {
        throw new Error('La solicitud fue aprobada previamente');
      }

      const newKeyEstado =
        newEstadoSolicitud === ESTADOS.SOL_APROBADA
          ? ESTADOS_ESPECIFICOS.SOL_APROBADA.getCode()
          : ESTADOS_ESPECIFICOS.SOL_NO_APROBADA.getCode();

      solicitud.prioridadCode = prioridad;
      solicitud.estadoCode = newEstadoSolicitud.getCode();

      await solicitudRp.save(solicitud);

      const estado = await this.createCambioEstadoDeprecated(this.qr, {
        estadoCode: newEstadoSolicitud.getCode(),
        estadoEspecificoCode: newKeyEstado,
        informacionAdicional: observaciones,
        solicitud,
      });

      estado.setTypes();

      await this.qr.commitTransaction();

      return estado;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
