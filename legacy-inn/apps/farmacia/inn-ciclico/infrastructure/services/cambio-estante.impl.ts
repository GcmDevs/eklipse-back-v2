import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import {
  CambioEstanteOrm,
  EstanteOrm,
  ProductoEstanteBasicOrm,
  ProductoEstanteOrm,
} from '@orm/inn/productos/estantes';

@Injectable()
export class CambioEstanteImpl extends BaseSource {
  public async execute(productId: number, estanteOrigenId: number, estanteDestinoId: number) {
    let transactionStarted = false;
    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const productoEstanteRp = this.conn.getRepository(ProductoEstanteBasicOrm);
      const cambioEstanteRp = this.conn.getRepository(CambioEstanteOrm);
      const estanteRp = this.conn.getRepository(EstanteOrm);

      if (estanteOrigenId === estanteDestinoId)
        throw new Error('No se puede mover el producto a mismo estante');

      const productoEstanteOrigen = await productoEstanteRp.findOne({
        where: { productoId: productId, estanteId: estanteOrigenId },
      });

      if (!productoEstanteOrigen) throw new Error('No se pudo obtener el producto');

      const estanteDestino = await estanteRp.findOne({
        where: { id: estanteDestinoId },
        relations: ['productos'],
      });
      if (!estanteDestino) throw new Error('No se pudo obtener el estante destino');

      productoEstanteOrigen.isActivo = false;

      await productoEstanteRp.save(productoEstanteOrigen);

      const productToEstanteDestino = new ProductoEstanteOrm();
      productToEstanteDestino.productoId = productoEstanteOrigen.productoId;
      productToEstanteDestino.estanteId = estanteDestino.id;
      productToEstanteDestino.stock = productoEstanteOrigen.stock;
      productToEstanteDestino.isActivo = true;

      const cambioEstante = new CambioEstanteOrm();
      cambioEstante.productoId = productoEstanteOrigen.productoId;
      cambioEstante.estanteOrigenId = estanteOrigenId;
      cambioEstante.estanteDestinoId = estanteDestino.id;
      cambioEstante.fechaCambio = new Date();
      cambioEstante.creadoPorId = this.auth.id;
      // cambioEstante.creadoPor = usuario;

      await cambioEstanteRp.save(cambioEstante);

      await productoEstanteRp.save(productToEstanteDestino);

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
