import { Injectable } from '@nestjs/common';
import { CotizacionOrm, DetalleSolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { gcmContextFactory } from '@common/domain/types';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { ProductoOrm as ActivoFijoProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import { CentralComprasSource } from '../../base';
import { UpdateItemSolicitudCompraDto } from '@inn/lgc/ctc/presentation/dtos';
import { TIPOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';

@Injectable()
export class UpdateItemSolicitudCompraImpl extends CentralComprasSource {
  public async execute(body: UpdateItemSolicitudCompraDto) {
    const ds = this.dynamicConn(gcmContextFactory(body.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const detalleSolicitudRp = localQr.manager.getRepository(DetalleSolicitudOrm);
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const productoRp = localQr.manager.getRepository(ProductoOrm);
      const activoFijoProductoRp = localQr.manager.getRepository(ActivoFijoProductoOrm);

      const item = await detalleSolicitudRp.findOneOrFail({ where: { id: body.itemId } });
      const cotizacion = body.cotizacionId
        ? await cotizacionRp.findOneOrFail({
            where: { id: body.cotizacionId },
            relations: ['detalle'],
          })
        : null;

      if (cotizacion?.cotDocumentoId) {
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
        c => c.cotDocumentoId && c.detalle.some(detalle => detalle.itemId === body.itemId)
      );
      if (itemTieneOrdenCompra) {
        throw new Error('El item ya estÃ¡ relacionado con una cotizaciÃ³n que tiene OC');
      }

      if (body.tipoCode && body.tipoCode !== item.tipoCode) {
        const tiposEditables: number[] = [TIPOS.PRODUCTOS.getCode(), TIPOS.ACTIVO_FIJO.getCode()];
        if (!tiposEditables.includes(body.tipoCode)) {
          throw new Error('Solo se puede cambiar entre productos y activos fijos');
        }

        if (!item.nombre?.trim() && item.productoId) {
          const productoActual =
            item.tipoCode === TIPOS.ACTIVO_FIJO.getCode()
              ? await activoFijoProductoRp.findOne({ where: { id: item.productoId } })
              : await productoRp.findOne({ where: { id: item.productoId } });
          item.nombre = productoActual?.descripcion ?? null;
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
      await localQr.commitTransaction();
      return true;
    } catch (error: any) {
      await localQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await localQr.release();
    }
  }
}
