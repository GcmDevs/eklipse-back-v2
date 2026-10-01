import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { BaseSource } from '@common/infrastructure/services';
import { uniq } from 'lodash';
import { ALMACEN_ID, NOMBRE_ESTANTE, VALORES_A_REGISTRAR } from './VALORES.constants';
import { ProductoOrm } from '@orm/inn/activos-fijos';
import { In } from 'typeorm';
import { EstanteOrm, ProductoEstanteBasicOrm } from '@orm/inn/productos/estantes';
import { TIPOS_ESTANTE } from '@ctypes/inn/productos';

@CommonGuards()
@Controller('v4/inn-ciclico')
export class ValoresController extends BaseSource {
  @Get('add-almacen')
  async addAlmacen() {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const productoRp = this.qr.manager.getRepository(ProductoOrm);
      const estanteRp = this.qr.manager.getRepository(EstanteOrm);
      const productoEstanteRp = this.qr.manager.getRepository(ProductoEstanteBasicOrm);

      let estante = await estanteRp.findOne({
        where: { almacenId: ALMACEN_ID, nombre: NOMBRE_ESTANTE },
      });

      if (!estante) {
        const newEstante = new EstanteOrm();
        newEstante.almacenId = ALMACEN_ID;
        newEstante.minutosVerificacionValida = 1440 * 7; //1 dia
        newEstante.nombre = NOMBRE_ESTANTE;
        newEstante.tipoCode = TIPOS_ESTANTE.NEVERA.getCode();
        estante = await estanteRp.save(newEstante);
      } else {
        throw new Error('Por ahora solo registros nuevos');
      }

      const codigosProductos = uniq(VALORES_A_REGISTRAR);
      const codigosNoEncontrados: string[] = [];

      const productos = await productoRp.find({ where: { codigo: In(codigosProductos) } });

      codigosProductos.forEach(c => {
        let exist = false;
        productos.forEach(p => {
          if (p.codigo === c) exist = true;
        });
        if (!exist) codigosNoEncontrados.push(c);
      });

      const productosEstantes: ProductoEstanteBasicOrm[] = [];

      productos.forEach(p => {
        const newProductoEstante = new ProductoEstanteBasicOrm();
        newProductoEstante.estanteId = estante.id;
        newProductoEstante.productoId = p.id;
        newProductoEstante.stock = 0;
        productosEstantes.push(newProductoEstante);
      });

      await productoEstanteRp.save(productosEstantes);

      await this.qr.commitTransaction();

      return { codigosNoEncontrados };
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
