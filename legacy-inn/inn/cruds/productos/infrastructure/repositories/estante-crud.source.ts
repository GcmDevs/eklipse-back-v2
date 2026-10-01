import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EstanteAlmacenOrm,
  ExistenciaActualI,
  ExistenciaProductoOrm,
  ProductoEstanteOrm,
} from '@inn/orm/inn';
import { orderBy } from 'lodash';
import { MoreThan } from 'typeorm';

@Injectable()
export class EstanteCrudSource extends BaseSource {
  public async fetchById(id: number, includeExistencias: boolean): Promise<EstanteAlmacenOrm> {
    try {
      const estanteRp = this.conn.getRepository(EstanteAlmacenOrm);
      const productoEstanteRp = this.conn.getRepository(ProductoEstanteOrm);

      const estante = await estanteRp.findOne({
        where: { id },
        relations: ['almacen'],
      });

      const productosByEstante = await productoEstanteRp.find({
        where: { estanteId: id },
        relations: ['producto'],
      });

      delete estante.almacenId;
      estante.setTypes(true);
      estante.productos = productosByEstante.map(p => p.producto);
      estante.productos.map(p => {
        p.nombre = p.descripcion;
        delete p.descripcion;
        delete p.agrupamientoId;
        delete p.grupoId;
        delete p.isBloqueado;
        p.setTypes(true);
      });

      if (includeExistencias) {
        const timeToCompare = new Date(new Date().getTime() + 15778800000); // 6 MESES

        for (let index = 0; index < estante.productos.length; index++) {
          const el = estante.productos[index];

          const productoInEstante = productosByEstante.filter(pe => pe.producto.id === el.id)[0];
          const existenciaRp = this.conn.getRepository(ExistenciaProductoOrm);
          let existencias = await existenciaRp.find({
            where: { productoId: el.id, cantidad: MoreThan(0) },
            relations: ['lote'],
          });

          existencias.map(e => {
            if (e.lote && e.lote.fechaVencimiento) e.fechaVencimiento = e.lote.fechaVencimiento;
          });

          existencias = orderBy(existencias, 'fechaVencimiento', 'asc');

          const existenciaActual: ExistenciaActualI = {
            cantidad: 0,
            vencimientoMasCercano: undefined,
            isVencimientoProximo: false,
            cantidadByAuditor: productoInEstante.stock,
          };

          el.existenciaActual = existenciaActual;
          existencias.forEach((e, i) => {
            if (!i) {
              el.existenciaActual.vencimientoMasCercano = e.fechaVencimiento;
              if (e.fechaVencimiento <= timeToCompare) {
                el.existenciaActual.isVencimientoProximo = true;
              }
            }
            el.existenciaActual.cantidad += e.cantidad;
          });
        }
      }

      return estante;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
