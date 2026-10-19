import { Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../base';
import { In, QueryRunner } from 'typeorm';
import { OldAprobarCotizacionDto, OldPreaprobarCotizacionDto } from '../../presentation/dtos';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  DetalleCotizacionOrm,
  DocumentoCotizacionOrm,
  PagoOrm,
  SolicitudOrm,
} from '@orm/inn/central-compras';
import { TIPOS, ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { DIAS_PLAZO_CAJA_MENOR } from '@inn/central-compras/application/constants';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import { cloneDeep } from 'lodash';
import { DocumentoOrm } from '@orm/inn/documentos';
import { ESTADOS_DOCUMENTO } from '@ctypes/inn/documentos';

@Injectable()
export class AprobacionesCotizacionesImpl extends CentralComprasSource {
  public async preaprobar(payload: OldPreaprobarCotizacionDto) {
    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const detalleCotizacionRp = localQr.manager.getRepository(DetalleCotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: payload.solicitudId } });

      if (solicitud.estadoCode !== ESTADOS.SOL_EN_COTI.getCode()) {
        throw new Error('Ya alguien revisó y aprobó la compra de los items previamente');
      }

      const detalleCotizacion = await detalleCotizacionRp.find({
        where: { id: In(payload.itemsIds), solicitudId: payload.solicitudId },
        relations: ['item'],
      });

      detalleCotizacion.map(item => {
        item.isAprobado = true;
      });

      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);

      const cotizaciones = await cotizacionRp.find({
        where: { id: In(detalleCotizacion.map(el => el.cotizacionId)) },
      });

      cotizaciones.map(ct => (ct.isActiva = true));

      await cotizacionRp.save(cotizaciones);

      await detalleCotizacionRp.save(detalleCotizacion);

      let estado: CambioEstadoOrm;
      if (!solicitud.isPagoPorCajaMenor) {
        estado = await this.createCambioEstadoDeprecated(localQr, {
          estadoEspecificoCode: ESTADOS_ESPECIFICOS.COTI_POR_APROBAR.getCode(),
          estadoCode: ESTADOS.COTI_POR_APROBAR.getCode(),
          solicitud,
        });

        solicitud.estadoCode = ESTADOS.COTI_POR_APROBAR.getCode();
      } else {
        const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);

        const cotizaciones = await cotizacionRp.find({
          where: { id: In(detalleCotizacion.map(el => el.cotizacionId)) },
        });

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

        const pagoRp = localQr.manager.getRepository(PagoOrm);
        await pagoRp.save(pagos);

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

        solicitud.estadoCode = ESTADOS.SOL_ULTIMOS_PASOS.getCode();
      }

      await solicitudRp.save(solicitud);

      await localQr.commitTransaction();

      return estado;
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await localQr.release();
    }
  }

  public async aprobar(
    payload: OldAprobarCotizacionDto,
    ignoreSameAuthor?: boolean,
    dataSource?: QueryRunner
  ) {
    const ds = this.dynamicConn(gcmContextFactory(payload.context));

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
        //aprobRequired = 2;
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

      /* if (estados.length >= aprobRequired) {
        throw new Error(
          `Las cotizaciones ya tienen las ${aprobRequired} verificaciones requeridas`
        );
      } */

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

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoCode: ESTADOS.COTI_APROBADA.getCode(),
        estadoEspecificoCode: newKeyType.getCode(),
        solicitud,
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

      return {
        hasAllVerifications: estados.length >= aprobRequired ? true : false,
        estado,
      };
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (!dataSource) await localQr.release();
    }
  }
}
