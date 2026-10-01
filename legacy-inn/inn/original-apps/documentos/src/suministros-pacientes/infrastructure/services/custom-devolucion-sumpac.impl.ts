import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { CustomDevolucionDetalleOrm, CustomDevolucionOrm } from '../orm/devolucion-custom';
import { Between, In, IsNull } from 'typeorm';
import { PacienteOrm } from '@inn/orm/gen';
import { Like } from 'typeorm';
import { EstanciaOrm } from '@inn/orm/hpn';
import { AgrupamientoProductoOrm, ProductoOrm } from '@inn/orm/inn';
import { CustomDevolucionSumPacDto } from '../../presentation/dtos';
import { TipoDevolucionCode, TIPOS_DEVOLUCION } from '../../domain/types';
import { orderBy, uniq } from 'lodash';

@Injectable()
export class CustomDevolucionSumpacImpl extends BaseSource {
  async fetch(inicio: Date, final: Date, tipoCode: TipoDevolucionCode) {
    const customDevolucionRp = this.conn.getRepository(CustomDevolucionOrm);

    const productoRp = this.conn.getRepository(ProductoOrm);
    const agrupamientoRp = this.conn.getRepository(AgrupamientoProductoOrm);

    const customDevoluciones = await customDevolucionRp.find({
      where: {
        fecha: Between(inicio, final),
        tipoCode: !tipoCode ? TIPOS_DEVOLUCION.DEVOLUCION_MEZCLA.getCode() : tipoCode,
      },
      relations: [
        'estancia',
        'estancia.ingreso',
        'estancia.ingreso.paciente',
        'estancia.cama',
        'estancia.cama.subgrupo',
        'creadoPor',
        'detalle',
      ],
    });

    let productosIds: number[] = [];

    customDevoluciones.forEach(c => {
      c.detalle.forEach(d => {
        if (d.productoId) productosIds.push(d.productoId);
      });
    });

    productosIds = uniq(productosIds);

    let productos: ProductoOrm[] | AgrupamientoProductoOrm[] = [];

    if (tipoCode === TIPOS_DEVOLUCION.DEVOLUCION_MEZCLA.getCode()) {
      productos = await productoRp.find({ where: { id: In(productosIds) } });
    } else {
      productos = await agrupamientoRp.find({ where: { id: In(productosIds) } });
    }

    customDevoluciones.map(c => {
      delete c.estanciaId;
      delete c.creadoPorId;
      if (c.estancia) {
        delete c.estancia.ingresoId;
        delete c.estancia.CamaId;
        delete c.estancia.fechaIngreso;
        delete c.estancia.fechaEgreso;
        delete c.estancia.dias;
        delete c.estancia.valor;
        delete c.estancia.esTrasladoAUrgencia;
        delete c.estancia.cama.subgrupoId;
        delete c.estancia.ingreso.fechaIngreso;
        delete c.estancia.ingreso.pacienteId;
        c.estancia.ingreso.paciente.setTypes(true);
      }
      delete c.creadoPor.id;
      delete c.creadoPor.estadoCode;
      c.detalle.map(d => {
        if (d.productoId) {
          const p = productos.filter(p => p.id === d.productoId);
          if (p.length) d.producto = p[0];
        }
        if (d.producto && d.producto.codigo) {
          d.codigo = d.producto.codigo;
        }
        delete d.devolucionId;

        d.setNombre(true);
        d.setTypes(true);
      });
    });
    return customDevoluciones;
  }

  public async create(payload: CustomDevolucionSumPacDto) {
    if (!payload.tipoCode) payload.tipoCode = TIPOS_DEVOLUCION.DEVOLUCION_MEZCLA.getCode();
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const customDevolucionRp = this.qr.manager.getRepository(CustomDevolucionOrm);
      const customDevolucionDetalleRp = this.qr.manager.getRepository(CustomDevolucionDetalleOrm);

      let newDevolucion = new CustomDevolucionOrm();
      let detalle: CustomDevolucionDetalleOrm[] = [];

      newDevolucion.estanciaId = payload.estanciaId;
      newDevolucion.creadoPorId = this.auth.user.id;
      newDevolucion.tipoCode = payload.tipoCode;
      newDevolucion.fecha = new Date();

      const devStored = await customDevolucionRp.save(newDevolucion);

      payload.detalle.forEach(item => {
        const newDetalle = new CustomDevolucionDetalleOrm();
        newDetalle.devolucionId = devStored.id;
        newDetalle.temporalId = item.temporalId;
        newDetalle.productoId = item.productoId;
        newDetalle.nombreCustom = item.nombreCustom;
        newDetalle.cantidad = item.cantidad;
        newDetalle.lote = item.lote;
        newDetalle.motivoCode = item.motivoDevolucionCode;
        newDetalle.estadoCode = item.estadoCode;
        detalle.push(newDetalle);
      });

      const detalleStored = await customDevolucionDetalleRp.save(detalle);

      await this.qr.commitTransaction();

      devStored.detalle = detalleStored;

      delete devStored.creadoPor;
      delete devStored.estanciaId;
      delete devStored.fecha;
      delete devStored.estancia;
      delete devStored.creadoPorId;
      devStored.detalle.map(item => {
        delete item.cantidad;
        delete item.lote;
        delete item.devolucion;
        delete item.devolucionId;
        delete item.estadoCode;
        delete item.motivoCode;
        delete item.motivoCode;
        delete item.nombreCustom;
        delete item.productoId;
        delete item.nombre;
      });

      return devStored;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async fetchByPattern(pattern: string) {
    const customPacienteRp = this.conn.getRepository(PacienteOrm);
    //const estanciaRp = this.conn.getRepository(EstanciaOrm);
    //const estancias = await estanciaRp.find({ where: { fechaEgreso: IsNull() } });
    //const IngresosIds = estancias.map(el => el.ingresoId);

    const allPacientes = await customPacienteRp.find({
      where: [
        { numDoc: Like(`%${pattern}%`) /* , ingresos: { id: In(IngresosIds) } */ },
        {
          nombreCompleto: Like(`%${pattern}%`),
          /* ingresos: { id: In(IngresosIds) }, */
        },
      ],
      relations: [
        'ingresos',
        'ingresos.estancias',
        'ingresos.estancias.cama',
        'ingresos.estancias.cama.subgrupo',
      ],
      take: 5,
    });

    allPacientes.map(p => {
      p.setTypes(true);
      p.ingresos = orderBy(p.ingresos, 'fechaIngreso', 'desc');
      p.ingresos.map(i => {
        delete i.pacienteId;
        if (i.estancias.length) {
          p.puedeTenerDevolucionMedicamentos = true;
          i.estancias = orderBy(i.estancias, 'fechaIngreso', 'desc');
          const estAbiert = i.estancias.filter(el => !el.fechaEgreso);
          if (estAbiert.length) i.estancias = estAbiert;
          i.estancias.map(e => {
            delete e.ingresoId,
              delete e.esTrasladoAUrgencia,
              delete e.dias,
              delete e.valor,
              delete e.fechaIngreso,
              delete e.CamaId;
          });
        }
      });
    });

    return allPacientes;
  }

  public async fetchByPatternProducto(pattern: string) {
    const customProductoRp = this.conn.getRepository(ProductoOrm);

    const productos = await customProductoRp.find({
      where: [
        { codigo: Like(`%${pattern}%`) },
        {
          descripcion: Like(`%${pattern}%`),
        },
      ],
      take: 5,
    });

    productos.map(pro => {
      delete pro.clase;
      delete pro.claseCode;
      delete pro.isBloqueado;
      delete pro.marca;
      delete pro.precioSugerido;
      delete pro.tipo;
      delete pro.tipoCode;
      delete pro.riesgoCode;
    });

    return productos;
  }

  public async fetchByPatternAgrupamiento(pattern: string) {
    const customProductoRp = this.conn.getRepository(AgrupamientoProductoOrm);

    const agrupamientos = await customProductoRp.find({
      where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
      take: 5,
    });

    return agrupamientos;
  }
}
