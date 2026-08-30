import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../../base';
import { ConfirmarOrdenCompraDto } from '@inn/lgc/ctc/presentation/dtos';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  PagoOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class ConfirmarOrdenCompraImpl extends CentralComprasSource {
  public async execute(payload: ConfirmarOrdenCompraDto) {
    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);
      const cambioEstadoRp = localQr.manager.getRepository(CambioEstadoOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
        relations: ['cotDocumento', 'cotDocumento.documento'],
      });

      const solicitud = await solicitudRp.findOneOrFail({ where: { id: cotizacion.solicitudId } });

      const pagos = await pagoRp.find({
        where: solicitud.isPagoPorCajaMenor
          ? { cotizacionId: cotizacion.id }
          : { cotizacionId: cotizacion.id, cotDocumentoId: cotizacion.cotDocumentoId },
      });

      const estados = await cambioEstadoRp.find({
        where: { solicitudId: solicitud.id },
        order: { id: 'DESC' },
      });

      const wasAprobed = estados.filter(
        el =>
          el.keyCode === ESTADOS_ESPECIFICOS.COTI_OC_APROBADA.getCode() &&
          el.entidadRelacionadaId === cotizacion.id
      );

      const pagosProgramados = pagos.filter(el => el.estadoAlProgramarId);

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      if (solicitud.wasRejected()) {
        throw new Error('Esta solicitud ya fue rechazada');
      }

      if (wasAprobed.length) {
        throw new Error('Esta solicitud ya fue aprobada previamente');
      }

      if (!cotizacion.cotDocumentoId && !solicitud.isPagoPorCajaMenor) {
        throw new Error(`Esta cotización no tiene ninguna orden de ${kwTO.tipoOrden} agregada`);
      }

      if (pagosProgramados.length) {
        throw new Error(`La ${kwTO.tipoOrden} de esta cotización ya tiene pagos realizados`);
      }

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode:
          payload.isAprobado === 1
            ? ESTADOS_ESPECIFICOS.COTI_OC_APROBADA.getCode()
            : ESTADOS_ESPECIFICOS.COTI_OC_NO_APROBADA.getCode(),
        estadoCode:
          payload.isAprobado === 1
            ? ESTADOS.SOL_ULTIMOS_PASOS.getCode()
            : payload.isAprobado === 2
              ? ESTADOS.SOL_RECHAZO_TEMPORAL.getCode()
              : ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} ${
          payload.isAprobado === 1
            ? 'APROBADA'
            : payload.isAprobado === 2
              ? 'RECHAZADA TEMPORALMENTE'
              : 'RECHAZADA DEFINITIVAMENTE'
        }${
          payload.isAprobado !== 1 && !solicitud.isPagoPorCajaMenor
            ? `, ${cotizacion.cotDocumento.documento.consecutivo}`
            : ''
        }${payload.observaciones ? ` - ${payload.observaciones}` : ''}`,
      });

      if (solicitud.isPagoPorCajaMenor && payload.isAprobado === 1) {
        pagos[0].fechaProgramacion = new Date();

        await pagoRp.save(pagos[0]);

        cotizacion.fechaProgramacion = new Date();
        cotizacion.contabilizada = true;

        await cotizacionRp.save(cotizacion);

        await this.createCambioEstadoDeprecated(localQr, {
          estadoEspecificoCode: ESTADOS_ESPECIFICOS.COTI_OC_PROGRAMADA.getCode(),
          estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
          solicitud,
          entidadRelacionadaId: cotizacion.id,
          informacionAdicional: `${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} programada automaticamente`,
        });

        await this.createCambioEstadoDeprecated(localQr, {
          estadoEspecificoCode: ESTADOS_ESPECIFICOS.COTI_OC_CONTABILIZADA.getCode(),
          estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
          solicitud,
          entidadRelacionadaId: cotizacion.id,
          informacionAdicional: `${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} contabilizada automaticamente`,
        });
      }

      if ([2, 3].indexOf(payload.isAprobado) >= 0 && !solicitud.isPagoPorCajaMenor) {
        cotizacion.cotDocumento = null;
      }

      await cotizacionRp.save(cotizacion);

      await localQr.commitTransaction();

      return { estado };
    } catch (error: any) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
