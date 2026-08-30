import { BadRequestException, Injectable } from '@nestjs/common';
import { DetalleSolicitudOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { ManageSolicitudDto } from '@inn/lgc/ctc/presentation/dtos';
import { TIPOS, ESTADOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ProductoOrm as AfnProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import { SOLICITUD_COMPRA_DIRECTA } from '@inn/lgc/ctc/types/gen/dependencias';
import { CentralComprasSource } from '../../base';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { DependenciaOrm } from '@inn/lgc/ctc/orm/gen';
import { CentroOrm } from '@inn/lgc/ctc/orm/adn';

@Injectable()
export class CreateSolicitudImpl extends CentralComprasSource {
  public async execute(payload: ManageSolicitudDto) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      if (payload.tipoCode === TIPOS.SERVICIOS.getCode()) {
        payload.detalle.map(item => {
          item.productoId = null;
          item.tipoCode = TIPOS.SERVICIOS.getCode();
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
        where: { id: payload.dependenciaOrigenId },
      });
      if (!dependencia) throw new Error('No existe dependencia con este id');

      let dependenciaDestino = dependencia;

      if (payload.dependenciaDestinoId !== payload.dependenciaOrigenId) {
        dependenciaDestino = await dependenciaRp.findOne({
          where: { id: payload.dependenciaDestinoId },
        });
        if (!dependenciaDestino) throw new Error('No existe dependencia destino con este id');
      }

      const dependenciasByUser = await this.fetchUserDependences(this.auth.id, this.auth.context);

      let newEstadoInicial = ESTADOS.SOL_CARG_COLABORADOR.getCode();

      if (dependenciasByUser.length) {
        if (
          !dependenciasByUser.filter(dp => dp.dependence.id === payload.dependenciaOrigenId).length
        ) {
          throw new Error('Usted no está relacionado con esta dependencia');
        }
      } else {
        newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
      }

      dependenciasByUser.forEach(el => {
        if (el.dependence.id === payload.dependenciaOrigenId) {
          if (SOLICITUD_COMPRA_DIRECTA.indexOf(el.role.code) >= 0) {
            newEstadoInicial = ESTADOS.SOL_REGISTRADA.getCode();
          }
        }
      });

      const newSolicitud = new SolicitudOrm();
      newSolicitud.prioridadCode = payload.prioridadCode;
      newSolicitud.tipoCode = payload.tipoCode;
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
        const tipoItem = dt.tipoCode || payload.tipoCode;

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
        item.fichaTecnica = dt.fichaTecnicaFileName ? dt.fichaTecnicaFileName : null;
        item.formatoInclusion = dt.formatoInclusionFileName ? dt.formatoInclusionFileName : null;
        item.tipoCode = tipoItem;
        item.nombre = dt.productoId ? null : dt.nombre;
        item.descripcion = dt.descripcion;

        detalleSolicitud.push(item);
      }

      await detalleSolicitudRp.save(detalleSolicitud);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();

      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
