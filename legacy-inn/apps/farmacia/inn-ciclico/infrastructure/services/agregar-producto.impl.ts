import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException } from '@nestjs/common';
import { ProductoOrm } from '@orm/inn/activos-fijos';
import { EstanteOrm, ProductoEstanteBasicOrm } from '@orm/inn/productos/estantes';

export class AgregarProductoImpl extends BaseSource {
  async execute(productoId: number, estanteId: number, stock: number) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      const productoRp = this.qr.manager.getRepository(ProductoOrm);
      const estanteRp = this.qr.manager.getRepository(EstanteOrm);
      const productoEstanteRp = this.qr.manager.getRepository(ProductoEstanteBasicOrm);

      const estante = await estanteRp.findOne({
        where: { id: estanteId },
      });
      if (!estante) throw new Error('No se encontro el estante');

      const producto = await productoRp.findOne({
        where: { id: productoId },
      });
      if (!producto) throw new Error('No se encontro el producto');

      const productoEstante = new ProductoEstanteBasicOrm();
      productoEstante.estanteId = estante.id;
      productoEstante.productoId = producto.id;
      productoEstante.stock = stock;
      productoEstante.isActivo = true;
      await productoEstanteRp.save(productoEstante);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      console.log(error);
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
