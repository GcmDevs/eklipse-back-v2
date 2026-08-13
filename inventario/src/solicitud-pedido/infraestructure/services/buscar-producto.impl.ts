import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';

import { gcmContextFactory } from '@common/domain/types';

import { ProductoOrm } from '@inn/orm/inn/productos';

@Injectable()
export class BuscarProductoImpl extends BaseSource {
  public async execute(codigo: string) {
    const ctx = gcmContextFactory(this.auth.context.getCode());

    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const productoRp = qr.manager.getRepository(ProductoOrm);
      const producto = await productoRp.findOne({
        where: { codigo },
      });

      if (!producto) throw new Error('No existe producto con este código');
      return {
        id: producto.id,
        codigo: producto.codigo,
        descripcion: producto.descripcionLarga,
      };
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
