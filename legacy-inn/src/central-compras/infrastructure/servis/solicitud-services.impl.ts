import { Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../base';
import { CotizacionOrm, DetalleSolicitudOrm } from '@orm/inn/central-compras';
import { OldUpdateProdOrServDto } from '../../presentation/dtos';
import { gcmContextFactory } from '@common/domain/types';
import { ProductoOrm } from '@orm/inn/productos';

@Injectable()
export class ServicesSolicitudesImpl extends CentralComprasSource {
  public async updateProductoOrServicioItemCotizado(body: OldUpdateProdOrServDto) {
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
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await localQr.release();
    }
  }
}
