import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { uniq } from 'lodash';
import { ItemCotizadoOrm, ProductoSetOrm, SetOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { ProveedorOrm } from '@inn/lgc/ctc/orm/gen';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { groupByKey } from '@common/application/services';

@Injectable()
export class SetCrudSource extends BaseSource {
  public async fetch() {
    const setRp = this.conn.getRepository(SetOrm);
    const sets = await setRp.find({ where: { isDeleted: false }, relations: ['productos'] });

    const productoSetRp = this.conn.getRepository(ProductoSetOrm);
    const productosSet = await productoSetRp.find();

    sets.map(set => {
      set.productos.map(producto => {
        const productoSet = productosSet.filter(
          el =>
            (el.set as any as number) === set.id && (el.producto as any as number) === producto.id
        )[0];

        producto.cantidad = productoSet.cantidad;
      });

      delete set.createdAt;
      delete set.isDeleted;
      delete set.usuarioId;
    });

    return sets;
  }

  public async fetchOfertasByProducto(id: number) {
    const itemCotizadoRp = this.conn.getRepository(ItemCotizadoOrm);
    const proveedorRp = this.conn.getRepository(ProveedorOrm);

    const itemsCotizados = await itemCotizadoRp.find({
      where: { productoId: id, isDeleted: false },
      relations: ['valor'],
    });

    const proveedoresIds: number[] = [];

    itemsCotizados.forEach(el => {
      proveedoresIds.push(el.proveedorId);
    });

    const proveedores = await proveedorRp.find({
      where: { id: In(uniq(proveedoresIds)) },
    });

    itemsCotizados.map(pd => {
      pd.proveedor = proveedores.filter(cbspr => cbspr.id === pd.proveedorId)[0];
      pd.nombreProveedor = pd.proveedor.nombre;
    });

    const dataGrouped = groupByKey(itemsCotizados, 'proveedorId', 'nombreProveedor');

    return dataGrouped.map(el => {
      const res: any = {};

      el.rows.forEach(row => {
        res.id = row.id;
        res.valor = row.valor.valor;
        res.IVA = row.valor.IVA;
      });

      res.proveedor = {
        id: el.rows[0].proveedor.id,
        codigo: el.rows[0].proveedor.codigo,
        nombre: el.rows[0].proveedor.nombre,
      };

      return res;
    });
  }

  public async fetchOfertas(setId: number) {
    const itemCotizadoRp = this.conn.getRepository(ItemCotizadoOrm);
    const proveedorRp = this.conn.getRepository(ProveedorOrm);
    const productoRp = this.conn.getRepository(ProductoOrm);

    const itemsCotizados = await itemCotizadoRp.find({
      where: { setId, isDeleted: false },
      relations: ['valor'],
    });

    const proveedoresIds: number[] = [];
    const productosIds: number[] = [];

    itemsCotizados.forEach(el => {
      proveedoresIds.push(el.proveedorId);
      productosIds.push(el.productoId);
    });

    const proveedores = await proveedorRp.find({
      where: { id: In(uniq(proveedoresIds)) },
    });

    const productos = await productoRp.find({
      where: { id: In(uniq(productosIds)) },
    });

    itemsCotizados.map(pd => {
      pd.producto = productos.filter(cbspr => cbspr.id === pd.productoId)[0];
      pd.proveedor = proveedores.filter(cbspr => cbspr.id === pd.proveedorId)[0];
      pd.nombreProveedor = pd.proveedor.nombre;
    });

    const dataGrouped = groupByKey(itemsCotizados, 'proveedorId', 'nombreProveedor');

    return dataGrouped.map(el => {
      const res: any = {};

      res.proveedor = {
        id: el.rows[0].proveedor.id,
        codigo: el.rows[0].proveedor.codigo,
        nombre: el.rows[0].proveedor.nombre,
      };

      res.oferta = [];

      el.rows.forEach(row => {
        res.oferta.push({
          id: row.id,
          codigo: row.producto.codigo,
          precio: row.valor.valor,
          cantidadSugerida: 0,
          iva: row.valor.IVA,
          producto: row.producto,
        });
      });

      return res;
    });
    /* 
    const proveedoresGrouped: CtGrouped<ProveeProductoOrm>[] = groupByKey(
      itemsCotizados,
      'proveedorId'
    ) as any;

    const dimProductos = await itemCotizadoRp.find({
      where: { cbsProductoId: In(cbsProductos.map(el => el.id)) },
      relations: ['innProducto'],
    });

    dimProductos.map(pr => {
      pr.cbsProducto = cbsProductos.filter(cbspr => cbspr.id === pr.cbsProductoId)[0];
    });

    proveedoresGrouped.map(pg => {
      pg.proveedor = proveedores.filter(pv => pv.id === pg.key)[0];
      pg.oferta = pg.rows[0].productos;
      delete pg.key;
      delete pg.name;
      delete pg.rows;
    });

    proveedoresGrouped.map(pg => {
      pg.oferta.map(pd => {
        delete pd.dimProductoId;
        delete pd.productoRelacionado.innProductoId;
        delete pd.productoRelacionado.cbsProductoId;
      });
    });

    return proveedoresGrouped; */
  }
}
