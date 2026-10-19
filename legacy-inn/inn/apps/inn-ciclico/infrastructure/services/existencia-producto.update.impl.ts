import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateExistenciaEstanteDto } from '@inn/ciclico/application/dtos';
import { BaseSource } from '@common/infrastructure/services';
import { ReporteExistenciaProductoOrm } from '../orm';
import { ProductoEstanteBasicOrm } from '@inn/orm/inn';
import { TABLE_NAMES } from '@inn/orm/table-names';
import { In } from 'typeorm';

@Injectable()
export class UpdateExistenciaProductoImpl extends BaseSource {
  async execute(estanteId: number, body: UpdateExistenciaEstanteDto[]) {
    for (let index = 0; index < body.length; index++) {
      const element = body[index];
      await this.verifyEntityExist(TABLE_NAMES.inn.productos, element.productoId);
    }
    await this.verifyEntityExist(TABLE_NAMES.inn.estantes, estanteId);

    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const repteExistProdRp = this.qr.manager.getRepository(ReporteExistenciaProductoOrm);
      const productoEstanteRp = this.qr.manager.getRepository(ProductoEstanteBasicOrm);

      const productosEstante = await productoEstanteRp.find({
        where: { productoId: In(body.map(e => e.productoId)), estanteId },
      });

      const newEntities: ReporteExistenciaProductoOrm[] = [];

      for (let index = 0; index < body.length; index++) {
        const element = body[index];
        const newEntity = new ReporteExistenciaProductoOrm();
        newEntity.createdAt = new Date();
        newEntity.estanteId = estanteId;
        newEntity.productoId = element.productoId;
        newEntity.stock = element.stock;
        newEntity.usuarioId = this.auth.user.id;
        newEntities.push(newEntity);

        productosEstante.map(pe => {
          if (pe.productoId === element.productoId) {
            pe.stock = element.stock;
          }
        });
      }

      await repteExistProdRp.save(newEntities);
      await productoEstanteRp.save(productosEstante);

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
