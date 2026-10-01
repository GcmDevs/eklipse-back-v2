import { BaseSource } from '@common/infrastructure/services';
import { ProductoOrm } from '@orm/inn/productos';
import { Like } from 'typeorm';

export class BuscarProductoImpl extends BaseSource {
  async execute(pattern: string) {
    try {
      const productoRp = this.conn.getRepository(ProductoOrm);
      const producto = await productoRp.find({
        where: { descripcion: Like(`%${pattern}%`) },
        take: pattern ? 5 : undefined,
      });

      return producto.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.descripcion,
      }));
    } catch (error) {
      console.log(error);
    }
  }
}
