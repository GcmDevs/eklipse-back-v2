import { BadRequestException, Injectable } from '@nestjs/common';
import { CotizacionPrefabricadaBaseSource } from '../base';
import { AddOfertaDto, UpdateValorDto } from '@inn/lgc/ctc/presentation/dtos';
import { In } from 'typeorm';
import { ProveedorOrm } from '@inn/lgc/ctc/orm/gen';
import { uniq } from 'lodash';
import { VALUES } from './values';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { ItemCotizadoOrm, ValorItemCotizadoOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { IVA } from '../../application/constants';

@Injectable()
export class CotizacionPrefabricadaServices extends CotizacionPrefabricadaBaseSource {
  public async registrarProveedores() {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const proveedorRp = this.qr.manager.getRepository(ProveedorOrm);
      const productoRp = this.qr.manager.getRepository(ProductoOrm);
      const itemCotizadoRp = this.qr.manager.getRepository(ItemCotizadoOrm);
      const valorItemCotizadoRp = this.qr.manager.getRepository(ValorItemCotizadoOrm);

      const codigosProveedores = uniq(VALUES.map(v => v.documentoTercero));
      const codigosProductos = uniq(VALUES.map(v => v.codigoProducto));

      const proveedores: ProveedorOrm[] = [];
      const productos: ProductoOrm[] = [];

      let codSerCons: string[] = [];

      for (let index = 0; index < codigosProveedores.length; index++) {
        const element = codigosProveedores[index];
        codSerCons.push(element);
        if (
          codSerCons.length === 1000 ||
          (index === codigosProveedores.length - 1 && codSerCons.length)
        ) {
          const tempServiciosIps = await proveedorRp.find({
            where: { codigo: In(codSerCons) },
            select: { id: true, codigo: true },
          });

          proveedores.push(...tempServiciosIps);
          codSerCons = [];
        }
      }

      codSerCons = [];

      for (let index = 0; index < codigosProductos.length; index++) {
        const element = codigosProductos[index];
        codSerCons.push(element);
        if (
          codSerCons.length === 1000 ||
          (index === codigosProductos.length - 1 && codSerCons.length)
        ) {
          const tempServiciosIps = await productoRp.find({
            where: { codigo: In(codSerCons) },
            select: { id: true, codigo: true },
          });

          productos.push(...tempServiciosIps);
          codSerCons = [];
        }
      }

      codigosProveedores.forEach(el => {
        const prov = proveedores.filter(pr => pr.codigo === el);
        if (!prov.length) console.log(el);
      });

      const DATA: ItemCotizadoOrm[] = [];

      VALUES.forEach(val => {
        const proveedor = proveedores.filter(p => p.codigo === val.documentoTercero);
        const producto = productos.filter(p => p.codigo === val.codigoProducto);
        const newItemCoti = new ItemCotizadoOrm();
        newItemCoti.productoId = producto[0].id;
        newItemCoti.proveedorId = proveedor[0].id;
        newItemCoti.valorId = 1;
        newItemCoti.valorMonetarioTemporal = val.valor;
        newItemCoti.isDeleted = false;
        DATA.push(newItemCoti);
      });

      let DATA_TOBESTORED: ItemCotizadoOrm[] = [];
      const ITEMS_STORED: ItemCotizadoOrm[] = [];

      for (let index = 0; index < DATA.length; index++) {
        const element = DATA[index];
        DATA_TOBESTORED.push(element);
        if (
          DATA_TOBESTORED.length === 300 ||
          (index === DATA.length - 1 && DATA_TOBESTORED.length)
        ) {
          const a = await itemCotizadoRp.save(DATA_TOBESTORED);
          ITEMS_STORED.push(...a);
          DATA_TOBESTORED = [];
        }
      }

      const DATA2: ValorItemCotizadoOrm[] = [];

      for (let index = 0; index < ITEMS_STORED.length; index++) {
        const el = ITEMS_STORED[index];
        const newVal = new ValorItemCotizadoOrm();
        newVal.IVA = 0;
        newVal.createdAt = new Date();
        newVal.createdById = this.auth.user.id;
        newVal.itemCotizadoId = el.id;
        newVal.valor = el.valorMonetarioTemporal;
        DATA2.push(newVal);
      }

      let DATA_TOBESTORED2: ValorItemCotizadoOrm[] = [];
      const ITEMS_STORED2: ValorItemCotizadoOrm[] = [];

      for (let index = 0; index < DATA2.length; index++) {
        const element = DATA2[index];
        DATA_TOBESTORED2.push(element);
        if (
          DATA_TOBESTORED2.length === 300 ||
          (index === DATA2.length - 1 && DATA_TOBESTORED2.length)
        ) {
          const a = await valorItemCotizadoRp.save(DATA_TOBESTORED2);
          ITEMS_STORED2.push(...a);
          DATA_TOBESTORED2 = [];
        }
      }

      await this.qr.manager.query(`
update EKINNCTCPFBITEM set EKINNCTCPFBITEMVAL = (select OID from EKINNCTCPFBITEMVAL  where EKINNCTCPFBITEM = EKINNCTCPFBITEM.OID);`);

      await this.qr.commitTransaction();
      return ITEMS_STORED;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async addOferta(body: AddOfertaDto): Promise<ItemCotizadoOrm> {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const proveedores = await this.verifyProveedores([body.terceroId]);
      await this.verifyProductos([body.productoId]);

      const itemCotizadoRp = this.qr.manager.getRepository(ItemCotizadoOrm);
      const valorItemCotizadoRp = this.qr.manager.getRepository(ValorItemCotizadoOrm);

      const ofertaExistente = await itemCotizadoRp.findOne({
        where: { proveedorId: body.terceroId, productoId: body.productoId, isDeleted: false },
      });

      if (ofertaExistente) {
        throw new Error('Ya existe una oferta de este proveedor para este producto');
      }

      const newItemCotizado = new ItemCotizadoOrm();
      newItemCotizado.productoId = body.productoId;
      newItemCotizado.proveedorId = body.terceroId;
      newItemCotizado.isDeleted = false;
      const itemCotizadoStored = await itemCotizadoRp.save(newItemCotizado);

      const newValor = new ValorItemCotizadoOrm();
      newValor.valor = body.valor;
      newValor.IVA = IVA;
      newValor.createdById = this.auth.user.id;
      newValor.createdAt = new Date();
      newValor.itemCotizadoId = itemCotizadoStored.id;
      const valorStored = await valorItemCotizadoRp.save(newValor);

      itemCotizadoStored.valorId = valorStored.id;

      await itemCotizadoRp.save(itemCotizadoStored);

      itemCotizadoStored.proveedor = proveedores[0];

      itemCotizadoStored.valor = valorStored;

      await this.qr.commitTransaction();
      return itemCotizadoStored;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async updateValor(body: UpdateValorDto): Promise<ItemCotizadoOrm> {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      await this.verifyProveedores([body.terceroId]);
      await this.verifyProductos([body.productoId]);

      const itemCotizadoRp = this.qr.manager.getRepository(ItemCotizadoOrm);
      const valorItemCotizadoRp = this.qr.manager.getRepository(ValorItemCotizadoOrm);

      const itemCotizado = await itemCotizadoRp.findOne({
        where: { productoId: body.productoId, proveedorId: body.terceroId },
      });

      if (!itemCotizado) {
        throw new Error('No existe una oferta de este proveedor para este producto');
      }

      const newValor = new ValorItemCotizadoOrm();
      newValor.IVA = IVA;
      newValor.createdAt = new Date();
      newValor.createdById = this.auth.user.id;
      newValor.valor = body.valor;
      newValor.itemCotizadoId = itemCotizado.id;

      const newValorStored = await valorItemCotizadoRp.save(newValor);

      itemCotizado.valorId = newValorStored.id;

      await itemCotizadoRp.save(itemCotizado);

      await this.qr.commitTransaction();
      return itemCotizado;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
