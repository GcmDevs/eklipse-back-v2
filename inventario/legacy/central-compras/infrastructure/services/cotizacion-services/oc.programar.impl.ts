import { orderBy } from 'lodash';
import { In, Not } from 'typeorm';
import { CentralComprasSource } from '../../base';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CotizacionOrm, PagoOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { ProgramarOrdenCompraDto } from '@inn/lgc/ctc/presentation/dtos';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { TIPOS_PAGO } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class ProgramarOrdenCompraImpl extends CentralComprasSource {
  public async execute(payload: ProgramarOrdenCompraDto) {
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    await qr.connect();
    try {
      await qr.startTransaction();
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const pagoRp = qr.manager.getRepository(PagoOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
        relations: ['cotDocumento', 'cotDocumento.documento', 'detalle', 'detalle.item'],
      });

      const isACredito = cotizacion.cotDocumento.tipoPagoCode === TIPOS_PAGO.A_CREDITO.getCode();

      const cotizaciones = await cotizacionRp.find({
        where: { id: Not(In([payload.cotizacionId])) },
      });

      const solicitud = await solicitudRp.findOneOrFail({ where: { id: cotizacion.solicitudId } });

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      if (solicitud.wasRejected()) throw new Error('Esta solicitud ya fue rechazada');

      if (!cotizacion.cotDocumentoId) {
        throw new Error(`Esta cotización no tiene ninguna orden de ${kwTO.tipoOrden} agregada`);
      }

      const pagos = await pagoRp.find({
        where: { cotizacionId: cotizacion.id, cotDocumentoId: cotizacion.cotDocumentoId },
      });

      const pagosPendientes = pagos.filter(el => el.fechaProgramacion === null);
      const pagosRealizados = pagos.filter(el => el.fechaProgramacion !== null);

      if (pagosRealizados.length) {
        throw new Error(`Solo se requiere programar el primer pago para obtener la firma`);
      }

      if (!pagosPendientes.length) {
        throw new Error(`Esta orden de ${kwTO.tipoOrden} no tiene ningún pago pendiente`);
      }

      if (pagosRealizados.length) payload.aprobadoCode = 1;

      const isAprobrado = payload.aprobadoCode === 1;
      const isDenTemp = payload.aprobadoCode === 2;

      const abb1 = `${kwTO.tipoOrdenAbr} ${cotizacion.cotDocumento.documento.consecutivo} de cot. #${cotizacion.id}`;
      const obs = `${payload.observaciones ? `, ${payload.observaciones}` : ''}`;

      const estado = await this.createCambioEstado(qr, {
        estadoEspecifico:
          payload.aprobadoCode === 1
            ? ESTADOS_ESPECIFICOS.COTI_OC_PROGRAMADA
            : ESTADOS_ESPECIFICOS.COTI_OC_NO_PROGRAMADA,
        estado:
          payload.aprobadoCode === 1
            ? ESTADOS.SOL_ULTIMOS_PASOS
            : payload.aprobadoCode === 2
              ? ESTADOS.SOL_RECHAZO_TEMPORAL
              : ESTADOS.SOL_RECHAZO_DEFINITIVO,
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: !isAprobrado
          ? `${abb1} RECHAZADA ${isDenTemp ? 'TEMPORALMENTE' : 'DEFINITIVAMENTE'}`
          : isACredito
            ? `${abb1} APROBADA PARA PAGOS A CREDITO (DEPENDEN DE TESORERÍA)`
            : `Pago a ${abb1} PROGRAMADO para el ${this.timer.formatDate(payload.fecha, 3)}` + obs,
      });

      const pagoPendiente = orderBy(pagosPendientes, 'id', 'asc')[0];

      pagoPendiente.fechaProgramacion = isAprobrado ? payload.fecha : null;

      pagoPendiente.estadoAlProgramarId = estado.id;
      pagoPendiente.estadoAlProgramar = estado;

      if (isAprobrado) {
        cotizacion.fechaProgramacion = payload.fecha;
        if (cotizacion.cotDocumento) {
          pagoPendiente.tipoPagoCode = cotizacion.cotDocumento.tipoPagoCode;
          const tipoPago = cotizacion.cotDocumento.tipoPagoCode;
          if (tipoPago === TIPOS_PAGO.A_CREDITO.getCode()) {
            cotizacion.contabilizada = true;
            cotizacion.pagada = true;
            solicitud.isFinished = true;
          } else if (tipoPago === TIPOS_PAGO.CREDIANTICIPO.getCode()) {
            if (pagosRealizados.length) {
              cotizacion.contabilizada = true;
            }
          }
        } else {
          cotizacion.contabilizada = true;
        }
      }

      cotizaciones.forEach(c => {
        if (c.isActiva !== false) if (!c.pagada) solicitud.isFinished = false;
      });

      await solicitudRp.save(solicitud);

      await pagoRp.save(pagoPendiente);

      if ([2, 3].indexOf(payload.aprobadoCode) >= 0) {
        cotizacion.cotDocumento = null;
      }

      await cotizacionRp.save(cotizacion);

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
