import { orderBy } from 'lodash';
import { MoreThan } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  EstanteOrm,
  ProductoEstanteBasicOrm,
  ProductoEstanteOrm,
} from '@orm/inn/productos/estantes';
import { tipoEstanteTypeFactory } from '@ctypes/inn/productos';
import {
  ExistenciaActualRes,
  FetchEstantesRes,
  ProductoRes,
} from '@farmacia/inn-ciclico/application/responses';
import { almacenOrmToAlmacenResFactory } from '../factories';
import { ESTADOS_ESTANTE } from '@farmacia/inn-ciclico/domain/types';
import { ExistenciaOrm } from '@orm/inn/productos';

@Injectable()
export class FetchEstantesImpl extends BaseSource {
  public async byId(id: number, includeExistencias: boolean): Promise<FetchEstantesRes> {
    try {
      const estanteRp = this.conn.getRepository(EstanteOrm);
      const productoEstanteRp = this.conn.getRepository(ProductoEstanteOrm);

      const estante = await estanteRp.findOne({
        where: { id },
        relations: ['almacen', 'ultimaVerificacion'],
      });

      const productosByEstante = await productoEstanteRp.find({
        where: { estanteId: id, isActivo: true },
        relations: ['producto'],
      });

      estante.productos = productosByEstante.map(p => p.producto);

      const response = new FetchEstantesRes();
      response.id = estante.id;
      response.nombre = estante.nombre;
      response.almacen = almacenOrmToAlmacenResFactory(estante.almacen);
      response.tipo = tipoEstanteTypeFactory(estante.tipoCode);
      response.productos = [];

      const timeToCompare = new Date(new Date().getTime() + 15778800000); // 6 MESES
      const now = new Date();
      const milisegundos = estante.minutosVerificacionValida * 60 * 1000;

      if (estante.ultimaVerificacion) {
        if (now.getTime() - estante.ultimaVerificacion.fechaCreacion.getTime() < milisegundos) {
          if (estante.ultimaVerificacion.fechaVerificacion) {
            response.estado = ESTADOS_ESTANTE.VERIFICADO;
          } else {
            response.estado = ESTADOS_ESTANTE.SIN_VERIFICACION;
          }
        } else {
          response.estado = ESTADOS_ESTANTE.SIN_CONTEO;
        }
      } else {
        response.estado = ESTADOS_ESTANTE.SIN_CONTEO;
      }

      if (includeExistencias) {
        for (let index = 0; index < estante.productos.length; index++) {
          const productoSelected = estante.productos[index];

          const el = new ProductoRes();
          el.id = productoSelected.id;
          el.codigo = productoSelected.codigo;
          el.nombre = productoSelected.descripcion;

          const productoInEstante = productosByEstante.filter(pe => pe.producto.id === el.id)[0];
          const existenciaActual = new ExistenciaActualRes();
          existenciaActual.cantidad = 0;
          existenciaActual.vencimientoMasCercano = undefined;
          existenciaActual.isVencimientoProximo = false;
          existenciaActual.cantidadByAuditor = productoInEstante.stock;
          el.isActivo = productoInEstante.isActivo;

          // existenciaActual.isActivo = productoInEstante.producto

          const existenciaRp = this.conn.getRepository(ExistenciaOrm);
          let existencias = await existenciaRp.find({
            where: { productoId: el.id, cantidad: MoreThan(0), almacenId: estante.almacenId },
            relations: ['lote'],
          });

          existencias = orderBy(existencias, 'fechaVencimiento', 'asc');

          el.existenciaActual = existenciaActual;
          existencias.forEach((e, i) => {
            if (!i) {
              if (e.lote && e.lote.fechaVencimiento) {
                el.existenciaActual.vencimientoMasCercano = e.lote.fechaVencimiento;
                if (e.lote.fechaVencimiento <= timeToCompare) {
                  el.existenciaActual.isVencimientoProximo = true;
                }
              }
            }
            el.existenciaActual.cantidad += e.cantidad;
          });
          response.productos.push(el);
        }
      }

      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
