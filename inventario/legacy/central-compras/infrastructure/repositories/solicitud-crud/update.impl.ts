import { BadRequestException, Injectable } from '@nestjs/common';
import { TIPOS, ESTADOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ManageSolicitudDto } from '@inn/lgc/ctc/presentation/dtos';
import { DetalleSolicitudOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { ProductoOrm as AfnProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import { DependenciaOrm } from '@inn/lgc/ctc/orm/gen';
import { ROL_DEPENDIENTES } from '@inn/lgc/ctc/types/gen/dependencias';
import { deleteFile } from '@common/presentation/helpers';
import { CentralComprasSource } from '../../base';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { CentroOrm } from '@inn/lgc/ctc/orm/adn';
import { CTC_FILE_LOCATIONS } from '@inn/lgc/ctc/application/constants';
import { consecutivosServices } from '@common/infrastructure/services';

@Injectable()
export class UpdateSolicitudCompraImpl extends CentralComprasSource {
  public async execute(payload: ManageSolicitudDto) {
    let transactionStarted = false;
    const baseUrlImg = CTC_FILE_LOCATIONS.itemsSolicitud;

    try {
      if (payload.tipoCode === TIPOS.SERVICIOS.getCode()) {
        payload.detalle.map(item => {
          item.productoId = null;
          item.tipoCode = TIPOS.SERVICIOS.getCode();
        });
      }

      const entities = await this._verifyEntities(payload);
      const newEstadoInicial = await this._verifyDependenciaState(payload.dependenciaOrigenId);

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

      solicitud.prioridadCode = payload.prioridadCode;
      solicitud.tipoCode = payload.tipoCode;
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
        const tipoItem = dt.tipoCode || payload.tipoCode;

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
        if (dt.fichaTecnicaFileName) {
          if (item.fichaTecnica) {
            deleteFile(`${baseUrlImg}/${item.fichaTecnica}`);
          }
          item.fichaTecnica = dt.fichaTecnicaFileName;
        }
        if (dt.formatoInclusionFileName) {
          if (item.formatoInclusion) deleteFile(`${baseUrlImg}/${item.formatoInclusion}`);
          item.formatoInclusion = dt.formatoInclusionFileName;
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
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      payload.detalle.forEach(el => {
        if (el.fichaTecnicaFileName) deleteFile(`${baseUrlImg}/${el.fichaTecnicaFileName}`);
        if (el.formatoInclusionFileName) deleteFile(`${baseUrlImg}/${el.formatoInclusionFileName}`);
      });

      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  private async _verifyEntities(payload: ManageSolicitudDto) {
    const dependenciaRp = this.conn.getRepository(DependenciaOrm);
    const centroRp = this.conn.getRepository(CentroOrm);

    const centro = await centroRp.findOne({ where: { id: payload.centroId } });
    if (!centro) throw new Error('No existe centro con este id');

    const dependencia = await dependenciaRp.findOne({ where: { id: payload.dependenciaOrigenId } });
    if (!dependencia) throw new Error('No existe dependencia con este id');

    return { centro, dependencia };
  }

  private async _verifyDependenciaState(dependenciaId: number) {
    const dependenciasByUser = await this.fetchUserDependences(this.auth.id, this.auth.context);

    let newEstadoInicial = ESTADOS.SOL_CARG_COLABORADOR.getCode();

    if (dependenciasByUser.length) {
      if (!dependenciasByUser.filter(dp => dp.dependence.id === dependenciaId).length) {
        throw new Error('Usted no está relacionado con esta dependencia');
      }
    } else {
      newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
    }

    dependenciasByUser.forEach(el => {
      if (el.dependence.id === dependenciaId) {
        if (
          [ROL_DEPENDIENTES.DIRECTOR.getCode(), ROL_DEPENDIENTES.COORDINADOR.getCode()].indexOf(
            el.role.code
          ) >= 0
        ) {
          newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
        }
      }
    });

    return newEstadoInicial;
  }
}
