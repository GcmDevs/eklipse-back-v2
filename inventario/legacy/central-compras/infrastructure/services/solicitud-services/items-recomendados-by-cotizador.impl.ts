import { cloneDeep } from 'lodash';
import { In, QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { GCM_CONTEXTS } from '@common/domain/types';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  DetalleCotizacionOrm,
  SolicitudOrm,
  DocumentoCotizacionOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import {
  ESTADOS,
  ESTADOS_ESPECIFICOS,
  EstadoType,
  TIPOS,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ESTADOS_DOCUMENTO } from '@inn/lgc/ctc/types/inn/documentos';
import { DocumentoOrm } from '@inn/lgc/ctc/orm/inn/documentos';
import { CentralComprasSource } from '../../base';
import {
  AprobacionCotizacionByCtCDto,
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

      await this.createCambioEstado(qr, {
        solicitud,
        estadoEspecifico: ESTADOS_ESPECIFICOS.COTI_POR_APROBAR,
        estado: ESTADOS.COTI_POR_APROBAR,
      });

      newEstadoSolicitud = ESTADOS.COTI_POR_APROBAR;

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
}
