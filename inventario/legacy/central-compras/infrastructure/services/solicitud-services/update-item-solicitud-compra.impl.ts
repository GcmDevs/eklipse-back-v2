import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CotizacionOrm,
  DetalleSolicitudOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import { gcmContextFactory } from '@common/domain/types';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { AfnProductoOrm as ActivoFijoProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import { CentralComprasSource } from '../../base';
import {
  CambiarTipoSolicitudDto,
  UpdateItemSolicitudCompraDto,
} from '@inn/lgc/ctc/presentation/dtos';
import {
  ESTADOS,
  ESTADOS_ESPECIFICOS,
  TIPOS,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';

@Injectable()
export class UpdateItemSolicitudCompraImpl extends CentralComprasSource {
  public async cambiarTipoSolicitud(body: CambiarTipoSolicitudDto): Promise<boolean> {
    const permisos = await this.ctcPermisos();
    if (!permisos.isSuperAdmin && !permisos.canAddCotizaciones && !permisos.canAddOrdenCompra) {
      throw new BadRequestException('No tiene permisos para cambiar el tipo de la solicitud');
    }
    const ds = this.dynamicConn(gcmContextFactory(body.context));
    const qr = ds.createQueryRunner();
    await qr.connect();

    try {
      await qr.startTransaction();
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const detalleRp = qr.manager.getRepository(DetalleSolicitudOrm);
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const productoRp = qr.manager.getRepository(ProductoOrm);
      const activoFijoRp = qr.manager.getRepository(ActivoFijoProductoOrm);

      const solicitud = await solicitudRp.findOneOrFail({
        where: { id: body.solicitudId },
        relations: ['detalle'],
      });
      const tipoAnterior = solicitud.tipoCode;
      const tiposPermitidos: number[] = [TIPOS.PRODUCTOS.getCode(), TIPOS.SERVICIOS.getCode()];
      if (!tiposPermitidos.includes(solicitud.tipoCode) || !tiposPermitidos.includes(body.tipoCode)) {
        throw new Error('Solo se puede cambiar una solicitud entre productos y servicios');
      }
      if (solicitud.tipoCode === body.tipoCode) {
        await qr.commitTransaction();
        return true;
      }

      const cotizaciones = await cotizacionRp.find({
        where: { solicitudId: solicitud.id },
        relations: ['detalle'],
      });
      const tieneItemAprobadoConOrdenCompra = cotizaciones.some(
        cotizacion =>
          !!cotizacion.cotDocumentoId &&
          cotizacion.detalle.some(detalle => detalle.isAprobado === true)
      );
      if (!permisos.isSuperAdmin && tieneItemAprobadoConOrdenCompra) {
        throw new Error(
          'La solicitud tiene items asociados a una orden de compra y no puede cambiar de tipo'
        );
      }

      if (body.tipoCode === TIPOS.SERVICIOS.getCode()) {
        for (const item of solicitud.detalle.filter(detalle => !detalle.isDeleted)) {
          if (!item.nombre?.trim() && item.productoId) {
            const producto =
              item.tipoCode === TIPOS.ACTIVO_FIJO.getCode()
                ? await activoFijoRp.findOne({ where: { id: item.productoId } })
                : await productoRp.findOne({ where: { id: item.productoId } });
            if (!producto?.descripcion?.trim()) {
              throw new Error(`No fue posible obtener el nombre del item ${item.id}`);
            }
            item.nombre = producto.descripcion.trim();
          }
          item.productoId = null;
          item.tipoCode = TIPOS.SERVICIOS.getCode();
        }
      } else {
        solicitud.detalle
          .filter(detalle => !detalle.isDeleted)
          .forEach(item => {
            item.productoId = null;
            item.tipoCode = TIPOS.PRODUCTOS.getCode();
          });
      }

      solicitud.tipoCode = body.tipoCode;
      await detalleRp.save(solicitud.detalle);
      await solicitudRp.save(solicitud);
      await this.createCambioEstado(qr, {
        solicitud,
        estado: ESTADOS.SOL_MODIFICADA,
        estadoEspecifico: ESTADOS_ESPECIFICOS.SOL_MODIFICADA,
        informacionAdicional: `TIPO DE SOLICITUD MODIFICADO DE ${tipoAnterior === 1 ? 'PRODUCTOS' : 'SERVICIOS'} A ${body.tipoCode === 1 ? 'PRODUCTOS' : 'SERVICIOS'}`,
      });
      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async execute(body: UpdateItemSolicitudCompraDto) {
    const permisos = await this.ctcPermisos();
    if (!permisos.isSuperAdmin && !permisos.canAddCotizaciones && !permisos.canAddOrdenCompra) {
      throw new BadRequestException('No tiene permisos para modificar productos');
    }
    const ds = this.dynamicConn(gcmContextFactory(body.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const detalleSolicitudRp = localQr.manager.getRepository(DetalleSolicitudOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const productoRp = localQr.manager.getRepository(ProductoOrm);
      const activoFijoProductoRp = localQr.manager.getRepository(ActivoFijoProductoOrm);

      const item = await detalleSolicitudRp.findOneOrFail({ where: { id: body.itemId } });
      const solicitud = await solicitudRp.findOneOrFail({ where: { id: item.solicitudId } });
      const cotizacion = body.cotizacionId
        ? await cotizacionRp.findOneOrFail({
            where: { id: body.cotizacionId },
            relations: ['detalle'],
          })
        : null;

      if (
        !permisos.isSuperAdmin &&
        cotizacion?.cotDocumentoId &&
        cotizacion.detalle.some(
          detalle => detalle.itemId === body.itemId && detalle.isAprobado === true
        )
      ) {
        throw new Error('La cotización tiene una OC, los items ya no pueden ser modificados');
      }

      if (cotizacion && !cotizacion.detalle.filter(el => el.itemId === body.itemId).length) {
        throw new Error('La cotización no contiene este item');
      }

      const cotizacionesDeSolicitud = await cotizacionRp.find({
        where: { solicitudId: item.solicitudId },
        relations: ['detalle'],
      });
      const itemTieneOrdenCompra = cotizacionesDeSolicitud.some(
        c =>
          c.cotDocumentoId &&
          c.detalle.some(detalle => detalle.itemId === body.itemId && detalle.isAprobado === true)
      );
      if (!permisos.isSuperAdmin && itemTieneOrdenCompra) {
        throw new Error('El item ya está relacionado con una cotización que tiene OC');
      }

      if (body.tipoCode && body.tipoCode !== item.tipoCode) {
        const tiposEditables: number[] = [
          TIPOS.PRODUCTOS.getCode(),
          TIPOS.SERVICIOS.getCode(),
          TIPOS.ACTIVO_FIJO.getCode(),
        ];
        if (!tiposEditables.includes(body.tipoCode)) {
          throw new Error('El tipo de item seleccionado no es editable');
        }

        const convertirAServicio = body.tipoCode === TIPOS.SERVICIOS.getCode();
        if (convertirAServicio && !item.nombre?.trim() && item.productoId) {
          const productoActual =
            item.tipoCode === TIPOS.ACTIVO_FIJO.getCode()
              ? await activoFijoProductoRp.findOne({ where: { id: item.productoId } })
              : await productoRp.findOne({ where: { id: item.productoId } });
          if (!productoActual?.descripcion?.trim()) {
            throw new Error('No fue posible obtener el nombre del producto que se convertirÃ¡');
          }
          item.nombre = productoActual.descripcion.trim();
        }

        item.productoId = null;
        item.tipoCode = body.tipoCode;
      }

      if (body.productoId) {
        const producto =
          item.tipoCode === TIPOS.ACTIVO_FIJO.getCode()
            ? await activoFijoProductoRp.findOneOrFail({ where: { id: body.productoId } })
            : await productoRp.findOneOrFail({ where: { id: body.productoId } });
        item.productoId = producto.id;
      } else if (body.nombreServicio) item.nombre = body.nombreServicio;
      else if (body.cantidad) item.cantidad = body.cantidad;
      else if (body.nombreMarca) item.marca = body.nombreMarca;

      await detalleSolicitudRp.save(item);
      await this.createCambioEstado(localQr, {
        solicitud,
        estado: ESTADOS.SOL_ITEM_MODIFICADO,
        estadoEspecifico: ESTADOS_ESPECIFICOS.SOL_ITEM_MODIFICADO,
        entidadRelacionadaId: item.id,
        informacionAdicional: `ITEM ${item.id} MODIFICADO`,
      });
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
