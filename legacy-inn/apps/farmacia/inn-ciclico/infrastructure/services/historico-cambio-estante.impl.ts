import { BaseSource } from '@common/infrastructure/services';
import { HistoricoCambioEstante } from '@farmacia/inn-ciclico/application/responses';
import { Injectable } from '@nestjs/common';
import { CambioEstanteOrm, ProductoEstanteOrm } from '@orm/inn/productos/estantes';
import { orderBy } from 'lodash';

@Injectable()
export class HistoricoCambioEstanteImpl extends BaseSource {
  //   public async execute(productId: number, estanteOrigenId: number, estanteDestinoId: number) {
  public async execute(productoId: number) {
    const historicoCambioEstanteRp = this.conn.getRepository(CambioEstanteOrm);
    const productoRp = this.conn.getRepository(ProductoEstanteOrm);

    const results = await historicoCambioEstanteRp.find({
      where: {
        productoId,
      },
      relations: ['estanteOrigen', 'estanteDestino', 'creadoPor'],
    });

    const producto = await productoRp.findOne({
      where: { productoId },
    });

    if (!producto) throw new Error('No se pudo obtener el producto');

    if (!results) throw new Error('No se pudo obtener el historico');

    const orderbyResults = orderBy(results, 'fechaCambio', 'desc');

    const cambioEstante: HistoricoCambioEstante[] = orderbyResults.map(r => {
      return {
        id: r.id,
        productoId: r.productoId,
        nombreProducto: producto.producto.descripcion,
        estanteOrigenId: r.estanteOrigenId,
        nombreEstanteOrigen: r.estanteOrigen.nombre,
        estanteDestinoId: r.estanteDestinoId,
        nombreEstanteDestino: r.estanteDestino.nombre,
        fechaCambio: r.fechaCambio,
        creadoPor: r.creadoPor,
      };
    });

    return cambioEstante;
  }
}
