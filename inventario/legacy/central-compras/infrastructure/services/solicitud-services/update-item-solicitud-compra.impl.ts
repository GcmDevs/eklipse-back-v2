import { Injectable } from '@nestjs/common';
import { CotizacionOrm, DetalleSolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { gcmContextFactory } from '@common/domain/types';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { CentralComprasSource } from '../../base';
import { UpdateItemSolicitudCompraDto } from '@inn/lgc/ctc/presentation/dtos';

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

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: body.cotizacionId },
        relations: ['detalle'],
      });

      if (cotizacion.cotDocumentoId) {
        throw new Error('La cotización tiene una OC, los items ya no pueden ser modificados');
      }

      if (!cotizacion.detalle.filter(el => el.itemId === body.itemId).length) {
        throw new Error('La cotización no contiene este item');
      }

      const item = await detalleSolicitudRp.findOneOrFail({ where: { id: body.itemId } });

      let producto: ProductoOrm;

      if (body.productoId) {
        producto = await productoRp.findOneOrFail({ where: { id: body.productoId } });
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
