import { BadRequestException, Injectable } from '@nestjs/common';
import { FILE_LOCATIONS } from '@common/application/constants';
import { TIPOS, ESTADOS } from '@ctypes/inn/central-compras/solicitudes';
import { consecutivosServices } from '@common/application/services';
import { OldManageSolicitudDto } from '@inn/central-compras/presentation/dtos';
import { DetalleSolicitudOrm, SolicitudOrm } from '@orm/inn/central-compras';
import { ProductoOrm as AfnProductoOrm } from '@orm/inn/activos-fijos';
import { deleteFile } from '@common/presentation/helpers';
import { CentralComprasSource } from '../../base';
import { CentroOrm } from '@orm/adn';
import { ProductoOrm } from '@orm/inn/productos';
import { ROL_DEPENDIENTES } from '@ctypes/gen/dependencias';
import { DependenciaOrm, UsuarioDependenciaOrm } from '@orm/gen';

@Injectable()
export class UpdateSolicitudesImpl extends CentralComprasSource {
  public async execute(payload: OldManageSolicitudDto) {
    let transactionStarted = false;

    try {
      if (payload.tipo === TIPOS.SERVICIOS.getCode()) {
        payload.detalle.map(item => {
          item.productoId = null;
          item.tipo = TIPOS.SERVICIOS.getCode();
        });
      }

      const entities = await this._verifyEntities(payload);
      const newEstadoInicial = await this._verifyDependenciaState(payload.dependenciaId);

      transactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();

      const detalleSolicitudRp = this.qr.manager.getRepository(DetalleSolicitudOrm);
      const activoFijoRp = this.qr.manager.getRepository(AfnProductoOrm);
      const solicitudRp = this.qr.manager.getRepository(SolicitudOrm);
      const productoRp = this.qr.manager.getRepository(ProductoOrm);

      let solicitud = new SolicitudOrm();

      if (payload.id) {
        solicitud = await solicitudRp.findOne({ where: { id: payload.id } });
        if (!solicitud) throw new Error('La solicitud no existe');
      }

      if (
        [ESTADOS.SOL_CARG_COLABORADOR.getCode(), ESTADOS.SOL_REGISTRADA.getCode()].indexOf(
          solicitud.estadoCode
        ) < 0
      ) {
        throw new Error(
          'Solo se puede modificar la solicitud si está REGISTRADA o CARGADA POR COLABORADOR'
        );
      }

      solicitud.prioridadCode = payload.prioridad;
      solicitud.tipoCode = payload.tipo;
      solicitud.estadoCode = newEstadoInicial;
      solicitud.centro = entities.centro;
      solicitud.dependencia = entities.dependencia;
      solicitud.isCotizacionUnica = false;
      solicitud.isFinished = false;
      solicitud.createdAt = new Date();
      solicitud.usuarioId = this.auth.user.id;
      solicitud.justificacion = payload.justificacion;

      const solicitudStored = await solicitudRp.save(solicitud);

      const detalleSolicitud: DetalleSolicitudOrm[] = [];

      for (let i = 0; i < payload.detalle.length; i++) {
        const dt = payload.detalle[i];
        let item = new DetalleSolicitudOrm();
        const tipoItem = dt.tipo || payload.tipo;

        let producto: ProductoOrm | AfnProductoOrm = this.createFakeProducto(dt.descripcion);

        if (dt.productoId) {
          const productoStored =
            tipoItem === TIPOS.PRODUCTOS.getCode()
              ? await productoRp.findOne({
                  where: { id: dt.productoId, isBloqueado: false },
                })
              : await activoFijoRp.findOne({ where: { id: dt.productoId } });
          if (!productoStored) throw new Error(`El producto ${producto.descripcion} no existe`);
          producto = productoStored;
        }

        if (dt.id && payload.id) {
          item = await detalleSolicitudRp.findOne({ where: { id: dt.id } });
          if (!item) throw new Error(`El item ${producto.descripcion} no existe`);
        }

        item.solicitudId = solicitudStored.id;
        item.productoId = producto.id;
        item.productoStored = producto;
        item.cantidad = dt.cantidad;
        item.marca = dt.marca;
        item.tipoCode = tipoItem;
        item.isDeleted = dt.isDeleted;
        if (dt.ftFileName) {
          if (item.fichaTecnica) {
            deleteFile(`${FILE_LOCATIONS.inn.ctc.itemsSolicitud}/${item.fichaTecnica}`);
          }
          item.fichaTecnica = dt.ftFileName;
        }
        if (dt.fiFileName) {
          if (item.formatoInclusion) {
            deleteFile(`${FILE_LOCATIONS.inn.ctc.itemsSolicitud}/${item.formatoInclusion}`);
          }
          item.formatoInclusion = dt.fiFileName;
        }

        if (dt.nombre === dt.descripcion) dt.descripcion = null;

        item.descripcion = dt.descripcion;
        if (!item.productoId) item.nombre = dt.nombre;
        else item.nombre = null;

        detalleSolicitud.push(item);
      }

      const detalleSolicitudStored = await detalleSolicitudRp.save(detalleSolicitud);

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
      if (transactionStarted) await this.qr.rollbackTransaction();
      payload.detalle.forEach(el => {
        if (el.ftFileName) deleteFile(`${FILE_LOCATIONS.inn.ctc.itemsSolicitud}/${el.ftFileName}`);
        if (el.fiFileName) deleteFile(`${FILE_LOCATIONS.inn.ctc.itemsSolicitud}/${el.fiFileName}`);
      });

      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  private async _verifyEntities(payload: OldManageSolicitudDto) {
    const dependenciaRp = this.conn.getRepository(DependenciaOrm);
    const centroRp = this.conn.getRepository(CentroOrm);

    const centro = await centroRp.findOne({ where: { id: payload.centroId } });
    if (!centro) throw new Error('No existe centro con este id');

    const dependencia = await dependenciaRp.findOne({ where: { id: payload.dependenciaId } });
    if (!dependencia) throw new Error('No existe dependencia con este id');

    return { centro, dependencia };
  }

  private async _verifyDependenciaState(dependenciaId: number) {
    const usuarioDependenciaRp = this.conn.getRepository(UsuarioDependenciaOrm);
    const dependenciasByUser = await usuarioDependenciaRp
      .createQueryBuilder('usuDep')
      .leftJoinAndSelect('usuDep.usuario', 'usuario')
      .leftJoinAndSelect('usuDep.dependencia', 'dependencia')
      .where('usuDep.usuario.id = :id', { id: this.auth.user.id })
      .getMany();

    let newEstadoInicial = ESTADOS.SOL_CARG_COLABORADOR.getCode();

    if (dependenciasByUser.length) {
      if (!dependenciasByUser.filter(dp => dp.dependencia.id === dependenciaId).length) {
        throw new Error('Usted no está relacionado con esta dependencia');
      }
    } else {
      newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
    }

    dependenciasByUser.forEach(el => {
      if (el.dependencia.id === dependenciaId) {
        if (
          [ROL_DEPENDIENTES.DIRECTOR.getCode(), ROL_DEPENDIENTES.COORDINADOR.getCode()].indexOf(
            el.rolCode
          ) >= 0
        ) {
          newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
        }
      }
    });

    return newEstadoInicial;
  }
}
