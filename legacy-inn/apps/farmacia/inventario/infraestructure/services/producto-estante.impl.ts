import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  CambioEstanteDto,
  EditarProductoEstanteDto,
  ProductoEstanteDto,
} from '@farmacia/inventario/dto/inventarios.dto';
import { ProductoOrm } from '@orm/inn/productos';
import { ProductoResponse } from '@farmacia/inventario/interface/producto.interface';
import { CambioEstanteOrm, EstanteInventarioOrm, ProductoEstantesOrm } from '@orm/inn/inventario';
import { In, IsNull, Like, Repository } from 'typeorm';
import {
  agruparProductosDuplicadosPorEstante,
  calcularDistribucionTraslado,
  calcularExistenciaBaseConteo,
} from '../../inventario.policies';

@Injectable()
export class ProductoEstanteImpl extends BaseSource {
  private buscarAsociacionActivaPorCodigo(
    repository: Repository<ProductoEstantesOrm>,
    estanteId: number,
    codigo: string,
    soloActivas = true
  ) {
    const query = repository
      .createQueryBuilder('productoEstante')
      .innerJoin('productoEstante.producto', 'producto')
      .where('productoEstante.estanteId = :estanteId', { estanteId })
      .andWhere('producto.codigo = :codigo', { codigo })
      .andWhere('(productoEstante.isDeleted = :isDeleted OR productoEstante.isDeleted IS NULL)', {
        isDeleted: false,
      });

    if (soloActivas) {
      query
        .andWhere('productoEstante.isActivo = :isActivo', { isActivo: true })
        .andWhere('productoEstante.isActivoEstante = :isActivoEstante', {
          isActivoEstante: true,
        });
    }

    return query.getOne();
  }

  public async listarProductosDuplicadosPorEstante() {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();

    try {
      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
      const asociaciones = await productoEstanteRp.find({
        where: [
          {
            isActivo: true,
            isActivoEstante: true,
            isDeleted: false,
          },
          {
            isActivo: true,
            isActivoEstante: true,
            isDeleted: IsNull(),
          },
        ],
        relations: ['estante', 'producto', 'producto.fabricante'],
        order: { estanteId: 'ASC', productId: 'ASC', id: 'ASC' },
      });

      const productos = asociaciones.map(asociacion => ({
        productoEstanteId: asociacion.id,
        estanteId: asociacion.estanteId,
        estanteNombre: asociacion.estante?.nombreEstante ?? '',
        productoId: asociacion.productId,
        codigoProducto: asociacion.producto?.codigo ?? '',
        descripcionProducto: asociacion.producto?.descripcion ?? '',
        fabricante: asociacion.producto?.fabricante?.nombre ?? '',
        stock: Number(asociacion.stock),
        ubicacion: asociacion.ubicacion ?? '',
        tipo: asociacion.tipo ?? '',
      }));

      return agruparProductosDuplicadosPorEstante(productos).map(grupo => ({
        estanteId: grupo.estanteId,
        estanteNombre: grupo.productos[0].estanteNombre,
        codigoProducto: grupo.codigoProducto,
        descripcionProducto: grupo.productos[0].descripcionProducto,
        cantidadDuplicados: grupo.cantidadDuplicados,
        productos: grupo.productos,
      }));
    } finally {
      await qr.release();
    }
  }

  public async crearProductoEstante(dto: ProductoEstanteDto) {
    const { estanteId, productoId, ubicacion, tipo, contextCode } = dto;

    const ctx = gcmContextFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    if (!estanteId || !productoId || !contextCode) {
      throw new BadRequestException('Todos los campos son obligatorios');
    }

    try {
      await qr.startTransaction();

      const productoRp = qr.manager.getRepository(ProductoOrm);
      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

      const estante = await estanteRp.findOne({ where: { id: estanteId } });
      if (!estante) {
        throw new NotFoundException(`No se encontro el estante con id ${estanteId}`);
      }

      const producto = await productoRp.findOne({
        where: { id: productoId },
        relations: ['existencias'],
      });

      if (!producto) {
        throw new NotFoundException('El producto no existe');
      }
      // const existente = await productoEstanteRp.findOne({
      //   where: { productId: productoId },
      // });

      // if (existente) {
      //   throw new BadRequestException(
      //     'Este producto ya está asignado a un estante. Solo puede tener un estante asignado.'
      //   );
      // }

      const duplicado = await this.buscarAsociacionActivaPorCodigo(
        productoEstanteRp,
        estanteId,
        producto.codigo
      );
      if (duplicado) {
        throw new BadRequestException(
          `El producto con codigo ${producto.codigo} ya esta asociado al estante ${estante.nombreEstante}.`
        );
      }

      const productoEstante = productoEstanteRp.create({
        estanteId,
        productId: productoId,
        isActivoEstante: true,
        ubicacion,
        tipo,
        isActivo: true,
      });

      await productoEstanteRp.save(productoEstante);
      await qr.commitTransaction();

      return productoEstante;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  public async buscarProductos(codigo: string) {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    try {
      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
      const productoRp = qr.manager.getRepository(ProductoOrm);

      const productos = await productoRp.find({
        where: { codigo },
      });

      if (productos.length === 0) {
        throw new NotFoundException(`No se encontraron productos con el código ${codigo}`);
      }

      const ids = productos.map(p => p.id);

      const productosEstante = await productoEstanteRp.find({
        where: [
          { productId: In(ids), isDeleted: false, isActivoEstante: true },
          { productId: In(ids), isDeleted: IsNull(), isActivoEstante: true },
        ],
        relations: ['producto', 'estante', 'producto.fabricante', 'producto.existencias'],
      });

      return productosEstante.map(pe => {
        const existenciaSistema = (pe.producto.existencias ?? []).reduce(
          (acc, e) => acc + Number(e.cantidad),
          0
        );
        console.log(pe);

        const existenciaEstante = pe.stock;

        return {
          id: pe.id,
          estanteId: pe.estanteId,
          nombreEstante: pe.estante.nombreEstante,
          productId: pe.productId,
          producto: {
            id: pe.producto.id,
            codigo: pe.producto.codigo,
            descripcion: pe.producto.descripcion,
            fabricante: pe.producto.fabricante.nombre,
            cantidad: calcularExistenciaBaseConteo(existenciaEstante, existenciaSistema),
          },
        };
      });
    } finally {
      await qr.release();
    }
  }

  public async excute() {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    try {
      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);

      const productosEstante = await productoEstanteRp.find({
        where: { isActivo: true },
        relations: ['producto'],
      });

      return productosEstante;
    } finally {
      await qr.release();
    }
  }

  public async buscarProducto(codigo: string): Promise<ProductoResponse> {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    try {
      const productoRp = qr.manager.getRepository(ProductoOrm);

      const producto = await productoRp.findOne({
        where: { codigo: codigo.trim() },
        relations: ['fabricante', 'existencias', 'agrupamiento'],
      });

      if (!producto) {
        throw new NotFoundException(`No se encontró producto con código ${codigo}`);
      }

      const existenciaSistema = (producto.existencias ?? []).reduce(
        (acc, e) => acc + Number(e.cantidad),
        0
      );

      return {
        id: producto.id,
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        marca: producto.marca,
        CUM: producto.CUM,
        fabricante: {
          id: producto.fabricante.id,
          nombre: producto.fabricante.nombre,
        },
        existenciaSistema,
        agrupamiento: producto.agrupamiento
          ? {
              id: producto.agrupamiento.id,
              nombre: producto.agrupamiento.nombre,
            }
          : null,
      };
    } finally {
      await qr.release();
    }
  }

  public async buscarProductosXdescripcion(descripcion: string) {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    try {
      const productoRp = qr.manager.getRepository(ProductoEstantesOrm);

      const productos = await productoRp.find({
        where: [
          {
            isDeleted: false,
            isActivoEstante: true,
            producto: { descripcion: Like(`%${descripcion}%`) },
          },
          {
            isDeleted: IsNull(),
            isActivoEstante: true,
            producto: { descripcion: Like(`%${descripcion}%`) },
          },
        ],
        relations: ['producto', 'estante', 'producto.fabricante', 'producto.existencias'],
      });

      if (productos.length === 0) {
        throw new NotFoundException(
          `No se encontraron productos con la descripción ${descripcion}`
        );
      }

      const productosMap = productos.map(pe => {
        const existenciaSistema = (pe.producto.existencias ?? []).reduce(
          (acc, e) => acc + Number(e.cantidad),
          0
        );
        const existenciaEstante = pe.stock;
        console.log(pe.estante.nombreEstante);

        return {
          id: pe.id,
          estanteId: pe.estanteId,
          nombreEstante: pe.estante.nombreEstante,
          productId: pe.productId,
          codigo: pe.producto.codigo,
          nombre: pe.producto.descripcion,
          fabricante: pe.producto.fabricante.nombre,
          cantidad: calcularExistenciaBaseConteo(existenciaEstante, existenciaSistema),
        };
      });
      console.log(productosMap);

      return productosMap;

      return productos.map(pe => {
        const existenciaSistema = (pe.producto.existencias ?? []).reduce(
          (acc, e) => acc + Number(e.cantidad),
          0
        );
        const existenciaEstante = pe.stock;
        console.log(pe.estante.nombreEstante);

        return {
          id: pe.id,
          estanteId: pe.estanteId,
          nombreEstante: pe.estante.nombreEstante,
          productId: pe.productId,
          codigo: pe.producto.codigo,
          nombre: pe.producto.descripcion,
          fabricante: pe.producto.fabricante.nombre,
          cantidad: calcularExistenciaBaseConteo(existenciaEstante, existenciaSistema),
        };
      });
    } finally {
      await qr.release();
    }
  }

  public async cambiarEstante(body: CambioEstanteDto) {
    const { estanteOrigenId, estanteDestinoId, productoEstanteId, tipoTraslado, cantidad } = body;

    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();

    if (estanteOrigenId === estanteDestinoId) {
      throw new BadRequestException('El estante origen y destino no pueden ser el mismo.');
    }

    try {
      await qr.startTransaction();

      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);
      const cambioEstanteRp = qr.manager.getRepository(CambioEstanteOrm);

      const estanteOrigen = await estanteRp.findOne({ where: { id: estanteOrigenId } });
      if (!estanteOrigen) {
        throw new NotFoundException(`No se encontró el estante origen con id ${estanteOrigenId}`);
      }

      const estanteDestino = await estanteRp.findOne({ where: { id: estanteDestinoId } });
      if (!estanteDestino) {
        throw new NotFoundException(`No se encontró el estante destino con id ${estanteDestinoId}`);
      }

      const origen = await productoEstanteRp.findOne({
        where: [
          { id: productoEstanteId, estanteId: estanteOrigenId, isDeleted: false },
          { id: productoEstanteId, estanteId: estanteOrigenId, isDeleted: IsNull() },
        ],
        relations: ['producto', 'producto.existencias'],
      });

      if (!origen) {
        throw new NotFoundException(
          `No se encontró el producto ${productoEstanteId} en el estante origen (${estanteOrigen.nombreEstante}).`
        );
      }

      const destinoExistente = await this.buscarAsociacionActivaPorCodigo(
        productoEstanteRp,
        estanteDestinoId,
        origen.producto.codigo,
        false
      );
      const destino =
        destinoExistente ??
        productoEstanteRp.create({
          productId: origen.productId,
          estanteId: estanteDestinoId,
          ubicacion: origen.ubicacion ?? null,
          tipo: origen.tipo ?? null,
          isActivo: true,
          isActivoEstante: true,
          isDeleted: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const existenciaProducto = (origen.producto?.existencias ?? []).reduce(
        (acc, e) => acc + Number(e.cantidad),
        0
      );

      const stockOrigen = origen.stock == null ? existenciaProducto : Number(origen.stock);

      if (stockOrigen <= 0) {
        throw new BadRequestException(
          'El producto no tiene stock disponible en el estante origen.'
        );
      }

      if (tipoTraslado === 'PARCIAL') {
        if (!cantidad || Number(cantidad) <= 0) {
          throw new BadRequestException('La cantidad es obligatoria para traslado parcial.');
        }
      }

      const cantTransferir = tipoTraslado === 'COMPLETA' ? stockOrigen : Number(cantidad);

      if (cantTransferir > stockOrigen) {
        throw new BadRequestException(
          `No puedes transferir ${cantTransferir}. Stock disponible en origen: ${stockOrigen}.`
        );
      }

      const stockDestinoActual = Number(destino.stock ?? 0);
      const distribucion = calcularDistribucionTraslado({
        stockOrigen,
        stockDestino: stockDestinoActual,
        tipoTraslado,
        cantidad: cantTransferir,
      });

      origen.stock = distribucion.stockOrigen;
      destino.stock = distribucion.stockDestino;
      origen.isActivoEstante = !distribucion.origenAgotado;
      destino.isActivoEstante = true;
      origen.isActivo = true;
      destino.isActivo = true;

      origen.updatedAt = new Date();
      destino.updatedAt = new Date();

      await productoEstanteRp.save([origen, destino]);

      const cambioEstante = cambioEstanteRp.create({
        productoEstanteId,
        estanteOrigenId,
        estanteDestinoId,
        fechaCambio: new Date(),
        usuarioCambioId: this.auth.id,
      });

      await cambioEstanteRp.save(cambioEstante);

      await qr.commitTransaction();

      return {
        ok: true,
        tipoTraslado,
        transferido: cantTransferir,
        origen: {
          estanteId: estanteOrigenId,
          stock: Number(origen.stock),
          isActivoEstante: origen.isActivoEstante,
        },
        destino: {
          estanteId: estanteDestinoId,
          stock: Number(destino.stock),
          isActivoEstante: destino.isActivoEstante,
        },
        cambioEstante,
      };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  public async obtenerCambiosEstante(productoEstanteId: number) {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    try {
      const cambioEstanteRp = qr.manager.getRepository(CambioEstanteOrm);

      const cambiosEstante = await cambioEstanteRp.find({
        where: { productoEstanteId },
        relations: ['usuario', 'estanteOrigen', 'estanteDestino'],
        order: { fechaCambio: 'DESC' },
      });

      return cambiosEstante.map(cambio => ({
        id: cambio.id,
        productoEstanteId: cambio.productoEstanteId,
        estanteOrigen: cambio.estanteOrigen.nombreEstante,
        estanteDestino: cambio.estanteDestino.nombreEstante,
        fechaCambio: cambio.fechaCambio,
        usuario: cambio.usuario.nombreCompleto,
      }));
    } finally {
      await qr.release();
    }
  }

  public async desactivarProductoEstante(productoEstanteId: number) {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    try {
      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);

      const productoEstante = await productoEstanteRp.findOne({
        where: { id: productoEstanteId },
      });

      if (!productoEstante) {
        throw new NotFoundException(
          `No se encontró el producto-estante con id ${productoEstanteId}`
        );
      }

      productoEstante.isDeleted = true;
      productoEstante.deletedAt = new Date();
      productoEstante.usuarioElimmino = this.auth.id;
      await productoEstanteRp.save(productoEstante);

      return { message: 'Producto-estante desactivado correctamente' };
    } finally {
      await qr.release();
    }
  }

  public async editarProductoEstante(dto: EditarProductoEstanteDto) {
    const { productoId, ubicacion, tipo, cantidad, estanteId } = dto;
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();

    try {
      await qr.startTransaction();

      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
      const productoRp = qr.manager.getRepository(ProductoOrm);

      const productoEstantes = await productoEstanteRp.find({
        where: [
          { productId: productoId, isDeleted: false, isActivoEstante: true },
          { productId: productoId, isDeleted: IsNull(), isActivoEstante: true },
        ],
      });

      const producto = await productoRp.findOne({
        where: { id: productoId },
        relations: ['existencias'],
      });

      if (!producto) {
        throw new NotFoundException('El producto no existe');
      }

      if (productoEstantes.length === 0) {
        throw new NotFoundException(`No se encontró el producto`);
      }

      const existenciaSistema = (producto.existencias ?? []).reduce(
        (acc, e) => acc + Number(e.cantidad),
        0
      );

      const estanteSeleccionado = productoEstantes.find(pe => pe.estanteId === estanteId);
      if (!estanteSeleccionado) {
        throw new NotFoundException(
          `No se encontró el producto ${productoId} en el estante ${estanteId}`
        );
      }

      if (cantidad !== undefined) {
        if (cantidad < 0) {
          throw new BadRequestException('La cantidad no puede ser negativa.');
        }

        if (cantidad > existenciaSistema) {
          throw new BadRequestException(
            `La cantidad no puede ser mayor a la existencia del sistema (${existenciaSistema}). Por favor revisa los datos del inventario.`
          );
        }

        const restante = Number((existenciaSistema - cantidad).toFixed(2));

        estanteSeleccionado.stock = Number(cantidad);
        estanteSeleccionado.updatedAt = new Date();

        if (ubicacion !== undefined) {
          estanteSeleccionado.ubicacion = ubicacion;
        }

        if (tipo !== undefined) {
          estanteSeleccionado.tipo = tipo;
        }

        const otrosEstantes = productoEstantes.filter(pe => pe.id !== estanteSeleccionado.id);

        if (otrosEstantes.length > 0) {
          const totalOtrosStockActual = otrosEstantes.reduce(
            (acc, pe) => acc + Number(pe.stock ?? 0),
            0
          );

          if (totalOtrosStockActual > 0) {
            let acumuladoDistribuido = 0;

            for (let index = 0; index < otrosEstantes.length; index += 1) {
              const pe = otrosEstantes[index];

              if (index === otrosEstantes.length - 1) {
                pe.stock = Number((restante - acumuladoDistribuido).toFixed(2));
              } else {
                const distribucion = Number(
                  ((Number(pe.stock ?? 0) / totalOtrosStockActual) * restante).toFixed(2)
                );
                pe.stock = distribucion;
                acumuladoDistribuido += distribucion;
              }

              pe.updatedAt = new Date();
            }
          } else {
            const cantidadPorEstante = Number((restante / otrosEstantes.length).toFixed(2));
            let acumulado = 0;

            for (let index = 0; index < otrosEstantes.length; index += 1) {
              const pe = otrosEstantes[index];

              if (index === otrosEstantes.length - 1) {
                pe.stock = Number((restante - acumulado).toFixed(2));
              } else {
                pe.stock = cantidadPorEstante;
                acumulado += cantidadPorEstante;
              }

              pe.updatedAt = new Date();
            }
          }

          await productoEstanteRp.save([estanteSeleccionado, ...otrosEstantes]);
        } else {
          // No hay otros estantes, solo se actualiza el actual.
          await productoEstanteRp.save(estanteSeleccionado);
        }
      } else {
        // Actualizar solo el estante especificado cuando no hay cambio de cantidad
        if (ubicacion !== undefined) {
          estanteSeleccionado.ubicacion = ubicacion;
        }
        if (tipo !== undefined) {
          estanteSeleccionado.tipo = tipo;
        }
        estanteSeleccionado.updatedAt = new Date();

        await productoEstanteRp.save(estanteSeleccionado);
      }

      await qr.commitTransaction();

      return productoEstantes;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }
}
