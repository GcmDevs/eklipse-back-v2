import { FILE_LOCATIONS, GcmContexts } from '@common/application/constants';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../base';
import { Like } from 'typeorm';
import { DetalleSolicitudOrm, SolicitudOrm } from '@orm/inn/central-compras';
import { ProductoOrm as AfnProductoOrm } from '@orm/inn/activos-fijos';
import { TIPOS, ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { consecutivosServices } from '@common/application/services';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import { DependenciaOrm, UsuarioDependenciaOrm, UsuarioOrm } from '@orm/gen';
import { CentroOrm } from '@orm/adn';
import { deleteFile } from '@common/presentation/helpers';
import { SOLICITUD_COMPRA_DIRECTA } from '@ctypes/gen/dependencias';
import { ProductoOrm } from '@orm/inn/productos';
import {
  OldCambiarEstadoSolicitudColaboradorDto,
  OldManageSolicitudDto,
} from '@inn/central-compras/presentation/dtos';

@Injectable()
export class SolicitudCrudSource extends CentralComprasSource {
  public async create(payload: OldManageSolicitudDto) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      if (payload.tipo === TIPOS.SERVICIOS.getCode()) {
        payload.detalle.map(item => {
          item.productoId = null;
          item.tipo = TIPOS.SERVICIOS.getCode();
        });
      }

      const centroRp = this.qr.manager.getRepository(CentroOrm);
      const productoRp = this.qr.manager.getRepository(ProductoOrm);
      const activoFijoRp = this.qr.manager.getRepository(AfnProductoOrm);
      const solicitudRp = this.qr.manager.getRepository(SolicitudOrm);
      const dependenciaRp = this.qr.manager.getRepository(DependenciaOrm);
      const detalleSolicitudRp = this.qr.manager.getRepository(DetalleSolicitudOrm);

      const centroId = payload.centroId ? payload.centroId : 1;

      const centro = await centroRp.findOne({ where: { id: centroId } });
      if (!centro) throw new Error('No existe centro con este id');

      const dependencia = await dependenciaRp.findOne({
        where: { id: payload.dependenciaId },
      });
      if (!dependencia) throw new Error('No existe dependencia con este id');

      let dependenciaDestino = dependencia;

      if (payload.dependenciaDestinoId !== payload.dependenciaId) {
        dependenciaDestino = await dependenciaRp.findOne({
          where: { id: payload.dependenciaDestinoId },
        });
        if (!dependenciaDestino) throw new Error('No existe dependencia destino con este id');
      }

      const usuarioDependenciaRp = this.conn.getRepository(UsuarioDependenciaOrm);
      const dependenciasByUser = await usuarioDependenciaRp
        .createQueryBuilder('usuDep')
        .leftJoinAndSelect('usuDep.usuario', 'usuario')
        .leftJoinAndSelect('usuDep.dependencia', 'dependencia')
        .where('usuDep.usuario.id = :id', { id: this.auth.user.id })
        .getMany();

      let newEstadoInicial = ESTADOS.SOL_CARG_COLABORADOR.getCode();

      if (dependenciasByUser.length) {
        if (!dependenciasByUser.filter(dp => dp.dependencia.id === payload.dependenciaId).length) {
          throw new Error('Usted no está relacionado con esta dependencia');
        }
      } else {
        newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
      }

      dependenciasByUser.forEach(el => {
        if (el.dependencia.id === payload.dependenciaId) {
          if (SOLICITUD_COMPRA_DIRECTA.indexOf(el.rolCode) >= 0) {
            newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
          }
        }
      });

      const newSolicitud = new SolicitudOrm();
      newSolicitud.prioridadCode = payload.prioridad;
      newSolicitud.tipoCode = payload.tipo;
      newSolicitud.estadoCode = newEstadoInicial;
      newSolicitud.centro = centro;
      newSolicitud.dependencia = dependencia;
      newSolicitud.dependenciaDestino = dependenciaDestino;
      newSolicitud.isCotizacionUnica = false;
      newSolicitud.isFinished = false;
      newSolicitud.createdAt = new Date();
      newSolicitud.usuarioId = this.auth.user.id;
      newSolicitud.justificacion = payload.justificacion;

      const solicitudStored = await solicitudRp.save(newSolicitud);

      const detalleSolicitud: DetalleSolicitudOrm[] = [];

      for (let i = 0; i < payload.detalle.length; i++) {
        const dt = payload.detalle[i];
        const item = new DetalleSolicitudOrm();
        const tipoItem = dt.tipo || payload.tipo;

        const producto = dt.productoId
          ? tipoItem === TIPOS.PRODUCTOS.getCode()
            ? await productoRp.findOne({ where: { id: dt.productoId, isBloqueado: false } })
            : await activoFijoRp.findOne({ where: { id: dt.productoId } })
          : this.createFakeProducto(dt.descripcion);

        item.solicitudId = solicitudStored.id;
        item.productoId = producto.id;
        item.productoStored = producto;
        item.cantidad = dt.cantidad;
        item.marca = dt.marca;
        item.fichaTecnica = dt.ftFileName ? dt.ftFileName : null;
        item.formatoInclusion = dt.fiFileName ? dt.fiFileName : null;
        item.tipoCode = tipoItem;
        item.nombre = dt.productoId ? null : dt.nombre;
        item.descripcion = dt.descripcion;

        detalleSolicitud.push(item);
      }

      const detalleSolicitudStored = await detalleSolicitudRp.save(detalleSolicitud);

      detalleSolicitudStored.map(d => {
        d.addProductosStoredToProductoForOldVersion();
      });

      solicitudStored.detalle = detalleSolicitudStored;
      solicitudStored.setTypes();
      solicitudStored.keyForTables = consecutivosServices.idWithContext(
        solicitudStored.id,
        this.auth.context,
        payload.centroId
      );
      solicitudStored.centro.contexto = this.auth.context.getCode();

      await this.qr.commitTransaction();

      return solicitudStored;
    } catch (error) {
      await this.qr.rollbackTransaction();
      payload.detalle.forEach(el => {
        if (el.ftFileName) deleteFile(`${FILE_LOCATIONS.inn.ctc.itemsSolicitud}/${el.ftFileName}`);
      });

      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async delete(context: GcmContexts, solicitudId: number, observaciones: string) {
    const localQr = this.dynamicConn(gcmContextFactory(context)).createQueryRunner();
    await localQr.connect();
    await localQr.startTransaction();
    try {
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const solicitud = await solicitudRp.findOne({ where: { id: solicitudId } });
      solicitud.estadoCode = ESTADOS.SOL_CANCELADA.getCode();
      await solicitudRp.save(solicitud);

      await this.createCambioEstadoDeprecated(localQr, {
        estadoCode: ESTADOS.SOL_CANCELADA.getCode(),
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_CANCELADA.getCode(),
        solicitud,
        informacionAdicional: observaciones ? observaciones : null,
      });

      await localQr.commitTransaction();
      return true;
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }

  public async moverAAMMedical(payload: { originalContext: GcmContexts; solicitudId: number }) {
    const localQr = this.dynamicConn(
      gcmContextFactory(payload.originalContext)
    ).createQueryRunner();
    const localQr2 = this.dynamicConn(GCM_CONTEXTS.AMMEDICAL).createQueryRunner();

    await localQr.connect();
    await localQr2.connect();

    await localQr.startTransaction();
    await localQr2.startTransaction();

    try {
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const solicitud = await solicitudRp.findOne({
        where: { id: +payload.solicitudId },
        relations: ['detalle', 'detalle.producto'],
      });

      if (!solicitud) throw new Error('No existe solicitud con este id en este centro');

      const solicitudAMRp = localQr2.manager.getRepository(SolicitudOrm);
      const detalleSolicitudAMRp = localQr2.manager.getRepository(DetalleSolicitudOrm);

      const existeSolicitud = await solicitudAMRp.findOne({
        where: {
          justificacion: Like(
            `%(Solicitud original ${consecutivosServices.idWithContext(
              payload.solicitudId,
              gcmContextFactory(payload.originalContext),
              solicitud.centroId
            )})%`
          ),
        },
      });

      if (existeSolicitud) {
        throw new Error(`Esta solicitud ya fue migrada (AM${existeSolicitud.id})`);
      }

      const newSolicitud = new SolicitudOrm();
      newSolicitud.prioridadCode = solicitud.prioridadCode;
      newSolicitud.tipoCode = solicitud.tipoCode;
      newSolicitud.estadoCode = ESTADOS.SOL_REGISTRADA.getCode();
      newSolicitud.centroId = 1;
      newSolicitud.dependenciaId = 1;
      newSolicitud.dependenciaDestinoId = 1;
      newSolicitud.isCotizacionUnica = false;
      newSolicitud.createdAt = new Date();
      newSolicitud.isFinished = false;
      newSolicitud.usuarioId = 24 /* ANAIS */ /*usuario.id*/;
      newSolicitud.justificacion = `${
        solicitud.justificacion
      } (Solicitud original ${consecutivosServices.idWithContext(
        solicitud.id,
        gcmContextFactory(payload.originalContext),
        solicitud.centroId
      )})`;

      const solicitudStored = await solicitudAMRp.save(newSolicitud);

      const detalleSolicitud: DetalleSolicitudOrm[] = [];

      for (let i = 0; i < solicitud.detalle.length; i++) {
        const item = solicitud.detalle[i];
        const newItem = new DetalleSolicitudOrm();

        const descripcion = item.descripcion
          ? item.descripcion.includes(' DESC.: ')
            ? item.descripcion.split(' DESC.: ')[1]
            : item.descripcion
          : ' DESC.: ';

        const producto = item.productoId
          ? this.createFakeProducto(`${item.producto.descripcion}${descripcion}`)
          : this.createFakeProducto(item.descripcion);

        newItem.solicitudId = solicitudStored.id;
        newItem.producto = producto;
        newItem.cantidad = item.cantidad;
        newItem.marca = item.marca;
        newItem.fichaTecnica = item.fichaTecnica ? item.fichaTecnica : null;
        newItem.formatoInclusion = item.formatoInclusion ? item.formatoInclusion : null;
        newItem.nombre = item.nombre;
        newItem.tipoCode = item.tipoCode;

        newItem.descripcion = producto.descripcion.toUpperCase();

        detalleSolicitud.push(newItem);
      }

      await detalleSolicitudAMRp.save(detalleSolicitud);

      solicitud.estadoCode = ESTADOS.SOL_REASIGNADA_OTRO_CENTRO.getCode();
      await solicitudRp.save(solicitud);

      await this.createCambioEstadoDeprecated(localQr, {
        estadoCode: ESTADOS.SOL_REASIGNADA_OTRO_CENTRO.getCode(),
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_REASIGNADA_OTRO_CENTRO.getCode(),
        solicitud,
        entidadRelacionadaId: null,
        archivoRelacionado: null,
        informacionAdicional: `REASIGNADA A AMMEDICAL (AM${solicitudStored.id})`,
      });

      await localQr.commitTransaction();
      await localQr2.commitTransaction();
      return true;
    } catch (error) {
      await localQr.rollbackTransaction();
      await localQr2.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
      await localQr2.release();
    }
  }

  public async cambiarEstadoSolicitudColaborador(payload: OldCambiarEstadoSolicitudColaboradorDto) {
    const localQr = this.dynamicConn(gcmContextFactory(payload.context)).createQueryRunner();
    await localQr.connect();
    await localQr.startTransaction();

    try {
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const solicitud = await solicitudRp.findOne({
        where: { id: +payload.solicitudId },
      });

      if (!solicitud) throw new Error('No existe solicitud con este id en este centro');

      const userRp = localQr.manager.getRepository(UsuarioOrm);
      const userFromDb = await userRp.findOne({
        where: { cedula: this.auth.user.document },
        select: {
          id: true,
          cedula: true,
          nombreCompleto: true,
        },
      });

      if (!userFromDb) {
        throw new Error('No existe usuario con tu cedula en el centro de la solicitud');
      }

      const usuarioDependenciaRp = localQr.manager.getRepository(UsuarioDependenciaOrm);
      const dependenciasByUser = await usuarioDependenciaRp
        .createQueryBuilder('usuDep')
        .leftJoinAndSelect('usuDep.usuario', 'usuario')
        .leftJoinAndSelect('usuDep.dependencia', 'dependencia')
        .where('usuDep.usuario.id = :id', { id: userFromDb.id })
        .getMany();

      const rolDepend = dependenciasByUser.filter(
        dp => dp.dependencia.id === solicitud.dependenciaId
      );

      if (!rolDepend.length) throw new Error('Usted no tiene relación con esta dependencia');

      if (SOLICITUD_COMPRA_DIRECTA.indexOf(rolDepend[0].rolCode) < 0) {
        throw new Error(
          'Usted no tiene la autorización en esta dependencia para aprobar la solicitud cargada por el colaborador'
        );
      }

      if (payload.isAprobado) {
        solicitud.estadoCode = ESTADOS.SOL_REGISTRADA.getCode();

        await this.createCambioEstadoDeprecated(localQr, {
          estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_REGISTRADA.getCode(),
          estadoCode: ESTADOS.SOL_REGISTRADA.getCode(),
          solicitud,
          informacionAdicional: payload.observaciones,
        });
      } else {
        solicitud.estadoCode = ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode();

        await this.createCambioEstadoDeprecated(localQr, {
          estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_DECLI_JEF_DEPEND.getCode(),
          estadoCode: ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode(),
          solicitud,
          informacionAdicional: payload.observaciones,
        });
      }

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
}
