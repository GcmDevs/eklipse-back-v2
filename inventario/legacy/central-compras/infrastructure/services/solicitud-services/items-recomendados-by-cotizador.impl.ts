import { cloneDeep } from 'lodash';
import { In, QueryRunner } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  DetalleCotizacionOrm,
  PagoOrm,
  SolicitudOrm,
  DocumentoCotizacionOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import {
  DIAS_PLAZO_CAJA_MENOR,
  IVA,
  SOLICITUDES_RECHAZADAS_ESTADOS_CODES,
} from '@inn/lgc/ctc/application/constants';
import {
  ESTADOS,
  ESTADOS_ESPECIFICOS,
  EstadoType,
  PRIORIDADES,
  TIPOS,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ESTADOS_DOCUMENTO } from '@inn/lgc/ctc/types/inn/documentos';
import { DocumentoOrm } from '@inn/lgc/ctc/orm/inn/documentos';
import { CentralComprasSource } from '../../base';
import {
  AprobacionCotizacionByCtCDto,
  ConvertirACajaMenorExpressDto,
  ItemsRecomendadosByCotizadorDto,
} from '@inn/lgc/ctc/presentation/dtos';

@Injectable()
export class ItemsRecomendadosByCotizadorImpl extends CentralComprasSource {
  public async recomendarItemsCotizaciones(payload: ItemsRecomendadosByCotizadorDto) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();
      const detCotiRp = qr.manager.getRepository(DetalleCotizacionOrm);
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: payload.solicitudId } });

      const detalleCotizacion = await detCotiRp.find({
        where: { id: In(payload.itemsIds), solicitudId: payload.solicitudId },
        relations: ['item'],
      });

      if (!solicitud) throw new Error('No se encontró esta solicitud');
      if (solicitud.estadoCode !== ESTADOS.SOL_EN_COTI.getCode()) {
        throw new Error('Ya alguien revisó y aprobó la compra de los items previamente');
      }
      if (detalleCotizacion.length !== payload.itemsIds.length) {
        throw new Error('Los items no coinciden');
      }

      detalleCotizacion.map(item => (item.isAprobado = true));

      const cotizacionesIds = detalleCotizacion.map(el => el.cotizacionId);
      const cotizacionesValidas = await cotizacionRp.find({ where: { id: In(cotizacionesIds) } });
      cotizacionesValidas.map(ct => (ct.isActiva = true));

      await cotizacionRp.save(cotizacionesValidas);
      await detCotiRp.save(detalleCotizacion);

      let newEstadoSolicitud: EstadoType;

      if (!solicitud.isPagoPorCajaMenor) {
        await this.createCambioEstado(qr, {
          solicitud,
          estadoEspecifico: ESTADOS_ESPECIFICOS.COTI_POR_APROBAR,
          estado: ESTADOS.COTI_POR_APROBAR,
        });

        newEstadoSolicitud = ESTADOS.COTI_POR_APROBAR;
      } else {
        await this._executeIfIsPagoPorCajaMenor(solicitud, detalleCotizacion, ctx, qr);
        newEstadoSolicitud = ESTADOS.SOL_ULTIMOS_PASOS;
      }

      solicitud.estadoCode = newEstadoSolicitud.getCode();

      await solicitudRp.save(solicitud);

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async aprobacionItemsCotizadosCtC(
    payload: AprobacionCotizacionByCtCDto,
    ignoreSameAuthor?: boolean,
    dataSource?: QueryRunner
  ) {
    const ds = this.dynamicConn(gcmContextFactory(payload.contextCode));

    let aprobRequired = 2;

    const newEstadoType = payload.isAprobado
      ? ESTADOS.COTI_APROBADA
      : ESTADOS.SOL_RECHAZO_DEFINITIVO;

    const newKeyType = payload.isAprobado
      ? ESTADOS_ESPECIFICOS.COTI_APROBADAS
      : ESTADOS_ESPECIFICOS.COTI_POR_APROBAR;

    const localQr = dataSource ? dataSource : ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cambioEstadoRp = localQr.manager.getRepository(CambioEstadoOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: payload.solicitudId } });

      if (solicitud.tipoCode === TIPOS.MEDICAMENTOS.getCode()) {
        const cotDocumentoRp = localQr.manager.getRepository(DocumentoCotizacionOrm);
        const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
        const documentoRp = localQr.manager.getRepository(DocumentoOrm);

        const cotizaciones = await cotizacionRp.find({ where: { solicitudId: solicitud.id } });

        const cotDocumentos = await cotDocumentoRp.find({
          where: { cotizacionId: In(cotizaciones.map(c => c.id)) },
        });

        const documentos = await documentoRp.find({
          where: { id: In(cotDocumentos.map(cd => cd.documentoId)) },
        });

        documentos.map(d => {
          d.estadoCode = ESTADOS_DOCUMENTO.CONFIRMADO.getCode();
          d.confirmadoPorId = this.auth.user.id;
          d.fechaConfirmacion = new Date();
        });

        await documentoRp.save(documentos);
      }

      const estados = await cambioEstadoRp.find({
        where: {
          solicitudId: payload.solicitudId,
          tipoCode: ESTADOS.COTI_APROBADA.getCode(),
        },
        relations: ['usuario'],
      });

      const usuarios = [
        //{ o: 1, ctx: GCM_CONTEXTS.AMMEDICAL, id: 164, nombre: 'NURY ESPERANZA RODRIGUEZ MURCIA' },
        { o: 1, ctx: GCM_CONTEXTS.AMMEDICAL, id: 120, nombre: 'CAROL XIMENA MORALES SOLANO' },
        { o: 2, ctx: GCM_CONTEXTS.AMMEDICAL, id: 1166, nombre: 'JORGE NELSON ANGULO PEREIRA' },
      ];

      if (solicitud.tipoCode !== TIPOS.MEDICAMENTOS.getCode()) {
        if (this.auth.context === GCM_CONTEXTS.AMMEDICAL) {
          const usuarioActual = cloneDeep(usuarios).filter(u => u.id === this.auth.id);
          if (usuarioActual.length) {
            if (!estados.length) {
              if (usuarioActual[0].id !== usuarios[0].id) {
                throw new Error(`Debe ser aprobado primero por ${usuarios[0].nombre}`);
              }
            }
            if (estados.length === 1) {
              if (usuarioActual[0].id !== usuarios[1].id) {
                throw new Error(`Debe ser aprobado primero por ${usuarios[1].nombre}`);
              }
            }
            if (estados.length === 2) {
              if (usuarioActual[0].id !== usuarios[2].id) {
                throw new Error(`Solo puede ser aprobado por ${usuarios[2].nombre}`);
              }
            }
          } else {
            throw new Error(`No es uno de los usuarios autorizados para esta aprobación`);
          }
        }
      }

      if (
        estados.filter(el => el.usuario.cedula === this.auth.user.document).length &&
        !ignoreSameAuthor
      ) {
        throw new Error('Usted ya aprobó esta cotización previamente');
      }

      if (
        estados.filter(el => el.keyCode === ESTADOS_ESPECIFICOS.COTI_POR_APROBAR.getCode()).length
      ) {
        throw new Error('Uno de los usuarios encargados desaprobó esta cotización');
      }

      const estado = await this.createCambioEstado(localQr, {
        solicitud,
        estado: ESTADOS.COTI_APROBADA,
        estadoEspecifico: newKeyType,
        informacionAdicional: `${estados.length + 1}${
          payload.observaciones ? `. Obs.: ${payload.observaciones}. ` : ''
        }`,
      });

      estados.push(estado);

      if (estados.length >= aprobRequired || newEstadoType === ESTADOS.SOL_RECHAZO_DEFINITIVO) {
        solicitud.estadoCode = payload.isAprobado
          ? ESTADOS.SOL_ULTIMOS_PASOS.getCode()
          : newEstadoType.getCode();

        await solicitudRp.save(solicitud);
      }

      await localQr.commitTransaction();

      return true;
    } catch (error: any) {
      await localQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (!dataSource) await localQr.release();
    }
  }

  private async _executeIfIsPagoPorCajaMenor(
    solicitud: SolicitudOrm,
    detalleCotizacion: DetalleCotizacionOrm[],
    ctx: GcmContextType,
    qr: QueryRunner
  ): Promise<void> {
    const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
    const pagoRp = qr.manager.getRepository(PagoOrm);
    const cotizacionesIds = detalleCotizacion.map(el => el.cotizacionId);
    const cotizaciones = await cotizacionRp.find({ where: { id: In(cotizacionesIds) } });
    const pagos: PagoOrm[] = [];
    cotizaciones.map(ct => (ct.isActiva = true));
    await cotizacionRp.save(cotizaciones);

    cotizaciones.forEach(ct => {
      const items = detalleCotizacion.filter(dt => dt.cotizacionId === ct.id);
      const pago = new PagoOrm();
      pago.valor = 0;
      items.forEach(it => {
        const valTotal = it.valorUnitario * it.item.cantidad;
        pago.valor += valTotal + (valTotal / 100) * it.IVA;
      });
      pago.cotizacionId = ct.id;
      pago.porcentaje = 100;
      pago.pagarAlFinTrabajo = false;
      pago.diasPlazo = DIAS_PLAZO_CAJA_MENOR;
      pagos.push(pago);
    });

    await pagoRp.save(pagos);

    const obs = 'PAGO POR CAJA MENOR, APROBACIÓN GENERADA AUTOMATICAMENTE';
    await this.aprobacionItemsCotizadosCtC(
      {
        contextCode: ctx.getCode(),
        solicitudId: solicitud.id,
        isAprobado: true,
        observaciones: obs,
      },
      true,
      qr
    );

    await this.aprobacionItemsCotizadosCtC(
      {
        contextCode: ctx.getCode(),
        solicitudId: solicitud.id,
        isAprobado: true,
        observaciones: obs,
      },
      true,
      qr
    );
  }

  public async cajaMenorExpress(payload: ConvertirACajaMenorExpressDto) {
    const { solicitudId, presupuesto, context } = payload;

    const localQr = this.dynamicQR(gcmContextFactory(context));

    await localQr.connect();
    await localQr.startTransaction();
    try {
      const solRp = localQr.manager.getRepository(SolicitudOrm);
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const detCotizacionRp = localQr.manager.getRepository(DetalleCotizacionOrm);
      const cambioEstadoRp = localQr.manager.getRepository(CambioEstadoOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);

      const solicitud = await solRp.findOne({ where: { id: solicitudId }, relations: ['detalle'] });
      const estados = await cambioEstadoRp.find({ where: { solicitudId }, order: { id: 'DESC' } });

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

      await this.createCambioEstado(localQr, {
        estado: ESTADOS.SOL_CAJA_MENOR_EXPRESS,
        estadoEspecifico: ESTADOS_ESPECIFICOS.SOL_CAJA_MENOR_EXPRESS,
        solicitud,
        entidadRelacionadaId: newCot.id,
        archivoRelacionado: null,
        informacionAdicional: `ATENDIDO POR CAJA MENOR${
          payload.observacion ? ' Obs.: ' + payload.observacion : ''
        }`,
      });

      await this.createCambioEstado(localQr, {
        estado: ESTADOS.SOL_EN_COTI,
        estadoEspecifico: ESTADOS_ESPECIFICOS.SOL_COTI_AGREGADA,
        solicitud,
        entidadRelacionadaId: newCot.id,
        archivoRelacionado: null,
        informacionAdicional: 'PROVEEDOR TEMPORAL (PAGO CAJA MENOR)',
      });

      await this.aprobacionItemsCotizadosCtC(
        {
          contextCode: payload.context,
          solicitudId: payload.solicitudId,
          isAprobado: true,
          observaciones: 'PAGO POR CAJA MENOR, APROBACIÓN GENERADA AUTOMATICAMENTE',
        },
        true,
        localQr
      );

      await this.aprobacionItemsCotizadosCtC(
        {
          contextCode: payload.context,
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

      await solRp.save(solicitud);

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
