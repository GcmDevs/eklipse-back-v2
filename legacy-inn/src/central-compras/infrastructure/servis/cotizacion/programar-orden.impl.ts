import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../../base';
import { orderBy } from 'lodash';
import { OldProgramarOrdenDto } from '@inn/central-compras/presentation/dtos';
import { CotizacionOrm, PagoOrm, SolicitudOrm } from '@orm/inn/central-compras';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { TIPOS_PAGO } from '@ctypes/inn/central-compras/cotizaciones';
import { gcmContextFactory } from '@common/domain/types';
import { In, Not } from 'typeorm';

@Injectable()
export class ProgramarOrdenImpl extends CentralComprasSource {
  public async execute(payload: OldProgramarOrdenDto) {
    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
        relations: ['cotDocumento', 'cotDocumento.documento', 'detalle', 'detalle.item'],
      });

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

      if (pagosRealizados.length) payload.isAprobado = 1;

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode:
          payload.isAprobado === 1
            ? ESTADOS_ESPECIFICOS.COTI_OC_PROGRAMADA.getCode()
            : ESTADOS_ESPECIFICOS.COTI_OC_NO_PROGRAMADA.getCode(),
        estadoCode:
          payload.isAprobado === 1
            ? ESTADOS.SOL_ULTIMOS_PASOS.getCode()
            : payload.isAprobado === 2
              ? ESTADOS.SOL_RECHAZO_TEMPORAL.getCode()
              : ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `${
          payload.isAprobado === 1 ? 'Pago a ' : '' + `${kwTO.tipoOrdenAbr} de `
        }cot. #${cotizacion.id} ${
          payload.isAprobado === 1
            ? `PROGRAMADO para el ${this.timer.formatDate(payload.fecha, 3)}`
            : `RECHAZADA ${payload.isAprobado === 2 ? 'TEMPORALMENTE' : 'DEFINITIVAMENTE'}`
        }${payload.isAprobado !== 1 ? `, ${cotizacion.cotDocumento.documento.consecutivo}` : ''}${
          payload.observaciones ? ` - ${payload.observaciones}` : ''
        }`,
      });

      const pagoPendiente = orderBy(pagosPendientes, 'id', 'asc')[0];

      pagoPendiente.fechaProgramacion = payload.isAprobado === 1 ? payload.fecha : null;

      pagoPendiente.estadoAlProgramarId = estado.id;
      pagoPendiente.estadoAlProgramar = estado;

      let newContabilizacionIsRequired = true;

      if (payload.isAprobado === 1) {
        cotizacion.fechaProgramacion = payload.fecha;
        if (cotizacion.cotDocumento) {
          pagoPendiente.tipoPagoCode = cotizacion.cotDocumento.tipoPagoCode;
          const tipoPago = cotizacion.cotDocumento.tipoPagoCode;
          if (tipoPago === TIPOS_PAGO.A_CREDITO.getCode()) {
            cotizacion.contabilizada = true;
            cotizacion.pagada = true;
            newContabilizacionIsRequired = false;
            solicitud.isFinished = true;
          } else if (tipoPago === TIPOS_PAGO.CREDIANTICIPO.getCode()) {
            if (pagosRealizados.length) {
              cotizacion.contabilizada = true;
              newContabilizacionIsRequired = false;
            }
          }
        } else {
          cotizacion.contabilizada = true;
          newContabilizacionIsRequired = false;
        }
      }

      cotizaciones.forEach(c => {
        if (c.isActiva !== false) if (!c.pagada) solicitud.isFinished = false;
      });

      await solicitudRp.save(solicitud);
      const pagoPendienteUpdated = await pagoRp.save(pagoPendiente);

      if ([2, 3].indexOf(payload.isAprobado) >= 0) {
        cotizacion.cotDocumento = null;
      }

      await cotizacionRp.save(cotizacion);

      await localQr.commitTransaction();

      return { estado, pago: pagoPendienteUpdated, newContabilizacionIsRequired };
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
