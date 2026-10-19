import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { DATAAM, estantes70, estantes71al78 } from '@farmacia/inventario/config/data';
import { CODEPRODUCT } from '@farmacia/inventario/config/productos';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EstanteInventarioOrm, ProductoEstantesOrm } from '@orm/inn/inventario';
import { ProductoOrm } from '@orm/inn/productos';
import { QueryRunner } from 'typeorm';

@Injectable()
export class AgregarProductosImpl extends BaseSource {
  public async agregarProductos() {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    // codigo: string[],
    // tipo: 'FARMACIA' | 'DISPOSITIVOS' | 'LIQUIDOS',
    // ubicacion: string,
    // estanteId: number

    const codigo = CODEPRODUCT;
    const tipo = 'FARMACIA';
    const ubicacion = 'A';
    const nombreEstante = 'ESTANTE 1';
    try {
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);
      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
      const productoRp = qr.manager.getRepository(ProductoOrm);

      const estante = await estanteRp.findOne({ where: { nombreEstante } });
      if (!estante) {
        throw new BadRequestException('Estante no encontrado');
      }

      for (const code of codigo) {
        const producto = await productoRp.findOne({
          where: { codigo: code },
          relations: ['existencias'],
        });

        if (!producto) {
          console.log(`El producto con código ${code} no existe.`);
          throw new BadRequestException(`El producto con código ${code} no existe.`);
        }

        const existente = await productoEstanteRp.findOne({
          where: { productId: producto.id },
        });

        if (existente) {
          console.log(`El producto con código ${code} ya está asignado a este estante.`);
          continue;
        }
        const existenciaSistema = producto.existencias.reduce(
          (acc, e) => acc + Number(e.cantidad),
          0
        );

        const newProductoEstante = productoEstanteRp.create({
          estanteId: estante.id,
          productId: producto.id,
          tipo: tipo,
          ubicacion: ubicacion,
          stock: existenciaSistema,
          isActivo: true,
        });

        await productoEstanteRp.save(newProductoEstante);
      }
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException(error.message);
    }
  }

  public async agregar() {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    const data = estantes70;

    const productosNoEncontrados: string[] = [];
    const productosDuplicados: string[] = [];
    let productosGuardados = 0;

    try {
      await qr.startTransaction();

      // const estantesAgrupados = this._agruparDatos(data);
      for (const est of estantes71al78) {
        const estanteGuardado = await this._guardarEstante(est, qr);

        const result = await this._guardarProductoEstanteSafe(est, estanteGuardado.id, qr);

        if (result.status === 'GUARDADO') productosGuardados++;
        if (result.status === 'NO_EXISTE') productosNoEncontrados.push(est.codigo);
        if (result.status === 'DUPLICADO') productosDuplicados.push(est.codigo);
        if (result.status === 'ERROR') productosNoEncontrados.push(est.codigo);
      }

      // for (const estante of estantesAgrupados) {
      //   const estanteGuardado = await this._guardarEstante(estante, qr);

      //   for (const producto of estante.productos) {
      //     const result = await this._guardarProductoEstanteSafe(producto, estanteGuardado.id, qr);

      //     if (result.status === 'GUARDADO') productosGuardados++;
      //     if (result.status === 'NO_EXISTE') productosNoEncontrados.push(producto.codigo);
      //     if (result.status === 'DUPLICADO') productosDuplicados.push(producto.codigo);
      //     if (result.status === 'ERROR') productosNoEncontrados.push(producto.codigo);
      //   }
      // }

      await qr.commitTransaction();

      return {
        guardados: productosGuardados,
        noEncontrados: productosNoEncontrados,
        duplicados: productosDuplicados,
      };
      // return estantesAgrupados;
    } catch (error) {
      await qr.rollbackTransaction();
      console.log('error', error);
      // throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  private _agruparDatos = (data: any[]) => {
    const estantesMap = new Map<number, any>();

    data.forEach(item => {
      const estanteNumero = item['# Estante'];

      // ❌ ignorar filas sin estante válido
      if (!estanteNumero) return;

      // crear estante si no existe
      if (!estantesMap.has(estanteNumero)) {
        estantesMap.set(estanteNumero, {
          estanteNombre: item.Estantes,
          almacen: item.Bodega,
          productos: [],
        });
      }

      // ❌ evitar productos vacíos
      if (!item.Codigo || !item.Descripción) return;

      const producto = {
        codigo: item.Codigo,
        ubicacion: item.Ubicación,
        // descripcion: item.Descripción,
        // laboratorio: item.Laboratorio,
        tipo: item.Tipo,
      };

      estantesMap.get(estanteNumero).productos.push(producto);
    });

    return Array.from(estantesMap.values());
  };

  private async _guardarProductoEstanteSafe(
    data: any,
    estanteId: number,
    qr: QueryRunner
  ): Promise<{ status: 'GUARDADO' | 'NO_EXISTE' | 'DUPLICADO' | 'ERROR' }> {
    try {
      const productoRepo = qr.manager.getRepository(ProductoOrm);
      const productoEstanteRepo = qr.manager.getRepository(ProductoEstantesOrm);

      const producto = await productoRepo.findOne({
        where: { codigo: String(data.codigo) },
        relations: ['existencias'],
      });

      if (!producto) return { status: 'NO_EXISTE' };

      const existente = await productoEstanteRepo.findOne({
        where: { productId: producto.id, estanteId },
      });

      if (existente) return { status: 'DUPLICADO' };

      const stock = producto.existencias.reduce((acc, e) => acc + Number(e.cantidad), 0);

      const nuevoProductoEstante = productoEstanteRepo.create({
        estanteId,
        productId: producto.id,
        tipo: data.tipo,
        ubicacion: data.ubicacion,
        // stock,
        isActivo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await productoEstanteRepo.save(nuevoProductoEstante);

      return { status: 'GUARDADO' };
    } catch (error) {
      console.error('Error guardando producto', error);
      return { status: 'ERROR' };
    }
  }

  private async _guardarEstante(data: any, qr: QueryRunner) {
    const estanteRepo = qr.manager.getRepository(EstanteInventarioOrm);

    const existente = await estanteRepo.findOne({
      where: {
        nombreEstante: data.estanteNombre,
        almacenId: data.almacen,
      },
    });

    if (existente) return existente;

    const nuevoEstante = estanteRepo.create({
      nombreEstante: data.estanteNombre,
      almacenId: data.almacen,
      estado: 'PENDIENTE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return estanteRepo.save(nuevoEstante);
  }
}
