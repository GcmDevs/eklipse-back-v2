import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { BaseSource } from '@common/infrastructure/services';
import { ProductoEstanteBasicOrm, ProductoOrm } from '@inn/orm/inn';
import { In } from 'typeorm';
import { VALUES } from './values';

@ApiTags('V1 - Productos (Recepción tecnica)')
@CommonGuards()
@Controller('v1/create-stantes')
export class StoreStantesController extends BaseSource {
  @Get()
  async createSugerencia() {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const estanteRp = this.qr.manager.getRepository(ProductoEstanteBasicOrm);
      const productoRp = this.qr.manager.getRepository(ProductoOrm);

      const productos = await productoRp.find({ where: { codigo: In(VALUES) } });

      const willBeStored: ProductoEstanteBasicOrm[] = [];

      productos.forEach(p => {
        const a = new ProductoEstanteBasicOrm();
        a.estanteId = 15;
        a.productoId = p.id;
        a.stock = 0;
        willBeStored.push(a);
      });

      await estanteRp.save(willBeStored);

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
