import { Like } from 'typeorm';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  BuscarExistenciaProductoEstanteDto,
  EstanteInventarioDto,
} from '@farmacia/inventario/dto/inventarios.dto';
import { EstanteInventarioOrm, ProductoEstantesOrm } from '@orm/inn/inventario';
import { EstantesMapper } from '@farmacia/inventario/mapper/estante.mapper';
import { AlmacenOrm, ProductoOrm } from '@orm/inn/productos';
import { ProductoEstanteOrm } from '@orm/inn/productos/estantes';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { ADMIN_AUTHORITY } from '@authorities/principal';

@Injectable()
export class EstanteInventarioImpl extends BaseSource {
  public async crearEstante(dto: EstanteInventarioDto) {
    const { nombreEstante, almacenId, contextCode } = dto;

    const ctx = gcmContextFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      if (!nombreEstante || !almacenId || !contextCode) {
        throw new BadRequestException('Todos los campos son obligatorios');
      }

      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

      const estanteExistente = await estanteRp.findOne({
        where: { nombreEstante, almacen: { id: almacenId } },
      });

      if (estanteExistente) {
        throw new BadRequestException('El estante ya existe en el almacén seleccionado');
      }

      const nuevoEstante = estanteRp.create({
        nombreEstante,
        almacen: { id: almacenId },
      });

      nuevoEstante.createdAt = new Date();
      nuevoEstante.updatedAt = new Date();
      nuevoEstante.estado = 'PENDIENTE';

      await estanteRp.save(nuevoEstante);
      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async buscarExistenciaProductoEstante(dto: BuscarExistenciaProductoEstanteDto) {
    const { estanteId, productoId } = dto;

    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();

    try {
      const productoEstanteRepo = qr.manager.getRepository(ProductoEstantesOrm);

      const productoEstante = await productoEstanteRepo.findOne({
        where: {
          estanteId,
          productId: productoId,
          isActivo: true,
          isActivoEstante: true,
        },
      });

      if (!productoEstante) {
        return false;
      }

      return true;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async crearEstanteArray() {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    try {
      await qr.startTransaction();
      for (let i = 1; i <= 69; i++) {
        try {
          const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

          const nombreEstante = `ESTANTE ${i}`;
          const almacenId = 1;

          const estanteExistente = await estanteRp.findOne({
            where: { nombreEstante, almacen: { id: almacenId } },
          });

          if (estanteExistente) {
            console.log(`El estante ${nombreEstante} ya existe en el almacén seleccionado`);
            continue;
          }

          const nuevoEstante = estanteRp.create({
            nombreEstante,
            almacen: { id: almacenId },
          });

          nuevoEstante.createdAt = new Date();
          nuevoEstante.updatedAt = new Date();
          nuevoEstante.estado = 'PENDIENTE';

          await estanteRp.save(nuevoEstante);
        } catch (error: any) {
          console.error(`Error al crear el estante ${i}: ${error.message}`);
        }
      }
      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      console.log(error);

      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async excute() {
    const qr = this.dynamicQR(this.auth.context);

    await qr.connect();
    try {
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

      const estantes = await estanteRp.find({
        // relations: {
        //   productos: {
        //     producto: {
        //       fabricante: true,
        //       existencias: true,
        //       agrupamiento: true,
        //     },
        //   },
        //   almacen: true,
        // },
      });
      const estantesSorted = estantes.sort((a, b) => {
        const nombreA = a.nombreEstante.toUpperCase();
        const nombreB = b.nombreEstante.toUpperCase();
        const regex = /(\d+)|(\D+)/g;

        const partsA = nombreA.match(regex);
        const partsB = nombreB.match(regex);

        const len = Math.min(partsA.length, partsB.length);

        for (let i = 0; i < len; i++) {
          const partA = partsA[i];
          const partB = partsB[i];

          const isNumericA = !isNaN(Number(partA));
          const isNumericB = !isNaN(Number(partB));

          if (isNumericA && isNumericB) {
            const diff = Number(partA) - Number(partB);
            if (diff !== 0) {
              return diff;
            }
          } else {
            const diff = partA.localeCompare(partB);
            if (diff !== 0) {
              return diff;
            }
          }
        }

        return partsA.length - partsB.length;
      });

      return estantesSorted.map(estante => EstantesMapper.toResponse(estante));
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async fetchAlmacenes(pattern: string) {
    try {
      const almacenRp = this.conn.getRepository(AlmacenOrm);
      const almacen = await almacenRp.find({
        where: { nombre: Like(`%${pattern}%`) },
        take: pattern ? 5 : undefined,
      });

      return almacen.map(alm => {
        return {
          id: alm.id,
          nombre: alm.nombre,
          codigo: alm.codigo,
        };
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getEstantePorId(id: number) {
    const qr = this.dynamicQR(this.auth.context);

    await qr.connect();
    try {
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

      // Consulta base sin las relaciones pesadas
      const estante = await estanteRp.findOne({
        where: { id },
        relations: {
          almacen: true,
          productos: {
            producto: true,
            conteoInventario: {
              ciclo: true,
              detalleConteo: true,
            },
          },
          asignaciones: {
            ciclo: true,
            usuario: true,
          },
        },
        // relations: ['almacen', 'productos', 'productos.producto', 'productos.asignaciones'],
      });

      if (!estante) {
        throw new BadRequestException('Estante no encontrado');
      }

      // Cargar asignaciones con ciclos solo si es necesario (lazy load)
      if (estante.productos && estante.productos.length > 0) {
        const productosRp = qr.manager.getRepository(ProductoOrm);

        // Cargar datos del producto en paralelo
        estante.productos = await Promise.all(
          estante.productos.map(async ep => {
            const prodDetalle = await productosRp.findOne({
              where: { id: ep.productId },
              relations: {
                fabricante: true,
                existencias: true,
                agrupamiento: true,
              },
            });
            return {
              ...ep,
              producto: prodDetalle || ep.producto,
            };
          })
        );
      }

      const asignacionUsuario = (estante.asignaciones ?? [])
        .filter(
          asignacion =>
            asignacion.isActivo &&
            (asignacion.numeroConteo === 1 || asignacion.numeroConteo === 2) &&
            asignacion.ciclo?.estado === 'ABIERTO' &&
            asignacion.usuario?.usuarioId === this.auth.id
        )
        .sort((a, b) => (b.cicloId ?? 0) - (a.cicloId ?? 0) || b.id - a.id)[0];

      const numeroConteo = asignacionUsuario?.numeroConteo ?? null;
      const cicloId = asignacionUsuario?.cicloId ?? null;
      const esAdministrador = await this.hasAnyAuthority([
        INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
        ADMIN_AUTHORITY,
      ]);

      if (!esAdministrador && !asignacionUsuario) {
        throw new ForbiddenException('No tiene una asignacion activa para este estante');
      }

      return EstantesMapper.toResponse(estante, { cicloId, numeroConteo });
    } catch (error) {
      throw error;
    } finally {
      await qr.release();
    }
  }
}
