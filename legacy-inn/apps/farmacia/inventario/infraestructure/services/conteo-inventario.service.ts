import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  AsignacionConteoOrm,
  ConteoInventarioOrm,
  DetalleConteoOrm,
  ProductoEstantesOrm,
  UsuarioConteoOrm,
  CicloInventarioOrm,
} from '@orm/inn/inventario';
import {
  AdminUpdateConteosDto,
  ConteoCambioDto,
  ConteoInventarioResponse,
  //RegistrarConteoResultado,
  RegistrarConteoConDetalleDto,
} from '@farmacia/inventario/dto/inventarios.dto';
import { ProductoOrm } from '@orm/inn/productos';
import { ESTADO_CONTEO, EstadoConteoCode } from '@ctypes/inn/inventario';
import { In, QueryRunner } from 'typeorm';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { ADMIN_AUTHORITY } from '@authorities/principal';
import {
  calcularExistenciaBaseConteo,
  construirEstadoConteoProducto,
  particionarItemsConteo,
  vincularDetallesConConteos,
} from '../../inventario.policies';

@Injectable()
export class ConteoInventarioService extends BaseSource {
  public async registrarConteo(dto: RegistrarConteoConDetalleDto) {
    const { items, numeroConteo, cicloId } = dto;
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
      const asignacionConteoRp = qr.manager.getRepository(AsignacionConteoOrm);
      const conteoInventarioRp = qr.manager.getRepository(ConteoInventarioOrm);
      const usuarioConteoRp = qr.manager.getRepository(UsuarioConteoOrm);
      const detalleConteoRp = qr.manager.getRepository(DetalleConteoOrm);
      const cicloRp = qr.manager.getRepository(CicloInventarioOrm);

      const esAdministrador = await this.hasAnyAuthority([
        INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
        ADMIN_AUTHORITY,
      ]);

      let usuarioConteo = await usuarioConteoRp.findOne({
        where: { usuarioId: this.auth.id },
      });

      if (!esAdministrador && numeroConteo === 3) {
        throw new ForbiddenException('El conteo 3 solo puede ser realizado por un administrador');
      }

      if (!esAdministrador && !usuarioConteo?.isActive) {
        throw new ForbiddenException('El usuario de conteo no está activo o no existe');
      }

      if (esAdministrador && !usuarioConteo) {
        usuarioConteo = await usuarioConteoRp.save(
          usuarioConteoRp.create({
            usuarioId: this.auth.id,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }

      const estanteProductoIds = items.map(i => i.estanteProductoId);

      if (new Set(estanteProductoIds).size !== estanteProductoIds.length) {
        throw new BadRequestException(
          'No se puede enviar el mismo producto-estante mas de una vez'
        );
      }

      const todosEstanteProductos = await productoEstanteRp.find({
        where: { id: In(estanteProductoIds) },
        relations: ['estante', 'producto', 'producto.existencias'],
      });

      if (todosEstanteProductos.length !== estanteProductoIds.length) {
        throw new BadRequestException('Uno o mas productos-estante no existen');
      }

      const { activos: itemsActivos, omitidos } = particionarItemsConteo(
        items,
        todosEstanteProductos
      );

      if (!itemsActivos.length) {
        throw new BadRequestException('No hay productos activos para guardar el conteo');
      }

      const productosActivosIds = new Set(itemsActivos.map(item => item.estanteProductoId));
      const estantesProductosActivos = todosEstanteProductos.filter(producto =>
        productosActivosIds.has(producto.id)
      );

      const estanteIds = [...new Set(estantesProductosActivos.map(ep => ep.estanteId))];

      const todasAsignaciones = esAdministrador
        ? []
        : await asignacionConteoRp.find({
            where: {
              estanteId: In(estanteIds),
              numeroConteo,
              usuarioId: usuarioConteo.id,
              isActivo: true,
            },
          });

      const todosConteosInventario = await conteoInventarioRp.find({
        where: { estanteProductoId: In([...productosActivosIds]) },
      });

      const todosCiclos = await cicloRp.find({
        where: { estanteId: In(estanteIds), estado: 'ABIERTO' },
        order: { id: 'DESC' },
      });

      const conteosExistentesIds = todosConteosInventario.map(c => c.id).filter(Boolean);
      const detallesExistentes = conteosExistentesIds.length
        ? await detalleConteoRp.find({
            where: { conteoInventarioId: In(conteosExistentesIds) },
          })
        : [];

      const resultados: ConteoInventarioResponse[] = [];
      const detallesNuevos: DetalleConteoOrm[] = [];
      const conteosParaGuardar: ConteoInventarioOrm[] = [];

      for (const item of itemsActivos) {
        const { estanteProductoId, cantidadContada } = item;
        const estanteProducto = todosEstanteProductos.find(ep => ep.id === estanteProductoId);

        if (!estanteProducto) {
          throw new BadRequestException(`El productoestante ${estanteProductoId} no existe`);
        }

        const asignacion = todasAsignaciones.find(
          a => a.estanteId === estanteProducto.estanteId && a.numeroConteo === numeroConteo
        );

        if (!esAdministrador && !asignacion) {
          throw new ForbiddenException(
            `No tiene una asignacion activa para el conteo ${numeroConteo} del estante ${estanteProducto.estanteId}`
          );
        }

        const cicloAbierto = todosCiclos.find(c => {
          if (c.estanteId !== estanteProducto.estanteId) return false;
          if (cicloId !== null && cicloId !== undefined && c.id !== cicloId) return false;
          if (!esAdministrador && c.id !== asignacion.cicloId) return false;
          return true;
        });

        const idCiclo = cicloAbierto?.id;

        if (!idCiclo) {
          throw new ForbiddenException('No se pudo determinar un ciclo válido para el conteo');
        }

        const ciclo = todosCiclos.find(c => c.id === idCiclo);
        if (ciclo && ciclo.estado !== 'ABIERTO') {
          throw new ForbiddenException(`El ciclo ${ciclo.id} está cerrado`);
        }

        let conteoInventario = todosConteosInventario.find(
          ci => ci.estanteProductoId === estanteProductoId && ci.cicloId === idCiclo
        );

        if (!conteoInventario) {
          conteoInventario = conteoInventarioRp.create({
            estanteProductoId,
            cicloId: idCiclo,
            estado: ESTADO_CONTEO.PENDIENTE.getCode(),
            totalConteoRealizado: 0,
            isCerrado: false,
          });
        }

        if (conteoInventario.isCerrado || conteoInventario.totalConteoRealizado >= 3) {
          throw new BadRequestException(
            `El conteo para el producto-estante ${estanteProductoId} ya está cerrado o completo`
          );
        }

        const detallesDelConteo = conteoInventario.id
          ? detallesExistentes.filter(d => d.conteoInventarioId === conteoInventario.id)
          : [];
        const estadoProducto = construirEstadoConteoProducto(detallesDelConteo);

        if (estadoProducto.conteosRealizados.includes(numeroConteo)) {
          throw new BadRequestException(
            `El conteo ${numeroConteo} ya fue registrado para el producto-estante ${estanteProductoId}`
          );
        }

        if (numeroConteo !== estadoProducto.siguienteConteoPermitido) {
          throw new BadRequestException(
            `El siguiente conteo permitido para el producto-estante ${estanteProductoId} en el ciclo ${idCiclo} es el ${estadoProducto.siguienteConteoPermitido}`
          );
        }

        const existenciaGlobal = (estanteProducto.producto?.existencias ?? []).reduce(
          (acc, e) => acc + Number(e.cantidad),
          0
        );
        const existenciaSistema = calcularExistenciaBaseConteo(
          estanteProducto.stock,
          existenciaGlobal
        );

        const detalle = detalleConteoRp.create({
          conteoInventario,
          usuarioId: usuarioConteo.id,
          numeroConteo,
          cantidadContada,
          coincidenciaSistema: Number(cantidadContada) === Number(existenciaSistema),
          countedAt: new Date(),
        });
        detallesNuevos.push(detalle);

        conteoInventario.totalConteoRealizado = estadoProducto.conteosRealizados.length + 1;

        conteoInventario.estado =
          Number(cantidadContada) === existenciaSistema
            ? ESTADO_CONTEO.AJUSTADO.getCode()
            : ESTADO_CONTEO.VERIFICAR.getCode();
        conteoInventario.numeroConteoCoincidente =
          Number(cantidadContada) === existenciaSistema ? numeroConteo : null;
        if (numeroConteo === 3) {
          conteoInventario.cantidadOficial = Number(cantidadContada);
          conteoInventario.isCerrado = true;
          conteoInventario.closedAt = new Date();
        }

        conteosParaGuardar.push(conteoInventario);

        resultados.push({
          conteoInventarioId: conteoInventario.id,
          estanteProductoId,
          coincidenciaSistema: detalle.coincidenciaSistema,
          existenciaSistema,
          estado: conteoInventario.estado,
          totalConteoRealizado: conteoInventario.totalConteoRealizado,
          isCerrado: conteoInventario.isCerrado,
          siguienteConteoPermitido: conteoInventario.isCerrado
            ? null
            : conteoInventario.totalConteoRealizado + 1,
          puedeSeguirContando: !conteoInventario.isCerrado,
        } as any);
      }

      await conteoInventarioRp.save(conteosParaGuardar);
      vincularDetallesConConteos(conteosParaGuardar, detallesNuevos);
      conteosParaGuardar.forEach((conteo, index) => {
        resultados[index].conteoInventarioId = conteo.id;
        resultados[index].numeroConteoCoincidente = conteo.numeroConteoCoincidente;
      });
      await detalleConteoRp.save(detallesNuevos);

      await qr.commitTransaction();

      return {
        totalRecibidos: items.length,
        totalProcesados: resultados.length,
        totalOmitidos: omitidos.length,
        omitidos,
        resultados,
      } as any;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  public async ActualizarConteoAdmin(dto: AdminUpdateConteosDto) {
    const { conteo1, conteo2 } = dto;

    if (!conteo1 && !conteo2) {
      throw new BadRequestException('Al menos un conteo debe ser proporcionado');
    }

    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();
      const detalleConteoRp = qr.manager.getRepository(DetalleConteoOrm);
      const conteoInventarioRp = qr.manager.getRepository(ConteoInventarioOrm);
      const usuarioConteoRp = qr.manager.getRepository(UsuarioConteoOrm);
      let administradorConteo = await usuarioConteoRp.findOne({
        where: { usuarioId: this.auth.id },
      });

      if (!administradorConteo) {
        administradorConteo = await usuarioConteoRp.save(
          usuarioConteoRp.create({
            usuarioId: this.auth.id,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }

      const mapping: Array<{ cicloId?: number; items?: ConteoCambioDto[]; numero: 1 | 2 }> = [
        { cicloId: conteo1?.cicloId, items: conteo1?.items, numero: 1 },
        { cicloId: conteo2?.cicloId, items: conteo2?.items, numero: 2 },
      ];

      for (const entry of mapping) {
        if (!entry.items) continue;

        for (const adminDto of entry.items) {
          const { estanteProductoId, conteo, id } = adminDto;

          if (!estanteProductoId || !entry.cicloId) {
            throw new BadRequestException('El producto-estante y el ciclo son obligatorios');
          }

          let conteoInv = await conteoInventarioRp.findOne({
            where: { estanteProductoId, cicloId: entry.cicloId },
          });

          if (!conteoInv) {
            if (entry.numero === 2) {
              throw new BadRequestException(
                `No se puede crear el conteo 2 del producto-estante ${estanteProductoId} sin conteo 1`
              );
            }
            const newConteo = conteoInventarioRp.create({
              estanteProductoId,
              cicloId: entry.cicloId,
              isCerrado: false,
              estado: ESTADO_CONTEO.PENDIENTE.getCode(),
              createdAt: new Date(),
              totalConteoRealizado: 0,
            });

            conteoInv = await conteoInventarioRp.save(newConteo);
          }

          const detallesActuales = await detalleConteoRp.find({
            where: { conteoInventarioId: conteoInv.id },
          });
          if (
            entry.numero === 2 &&
            !detallesActuales.some(detalleActual => detalleActual.numeroConteo === 1)
          ) {
            throw new BadRequestException(
              `No se puede crear el conteo 2 del producto-estante ${estanteProductoId} sin conteo 1`
            );
          }

          const estadoEditado = await this.calcularEstadoConteoAdmin(qr, estanteProductoId, conteo);
          const coincidenciaSistema = estadoEditado === ESTADO_CONTEO.AJUSTADO.getCode();

          let detalle: DetalleConteoOrm | undefined;
          if (typeof id === 'number' && id > 0) {
            detalle = await detalleConteoRp.findOne({ where: { id } });
            if (
              !detalle ||
              detalle.conteoInventarioId !== conteoInv.id ||
              detalle.numeroConteo !== entry.numero
            ) {
              throw new BadRequestException('El detalle no pertenece al producto, ciclo y conteo');
            }
          }

          if (!detalle) {
            detalle = detallesActuales.find(
              detalleActual => detalleActual.numeroConteo === entry.numero
            );
          }

          if (!detalle) {
            detalle = detalleConteoRp.create({
              conteoInventarioId: conteoInv.id,
              numeroConteo: entry.numero,
              cantidadContada: conteo,
              coincidenciaSistema,
              countedAt: new Date(),
              usuarioId: administradorConteo.id,
            });
          } else {
            detalle.cantidadContada = conteo;
            detalle.coincidenciaSistema = coincidenciaSistema;
            detalle.countedAt = new Date();
          }

          await detalleConteoRp.save(detalle);

          const detallesGuardados = await detalleConteoRp.find({
            where: { conteoInventarioId: conteoInv.id },
            order: { numeroConteo: 'ASC' },
          });
          const ultimoDetalle = detallesGuardados[detallesGuardados.length - 1];
          conteoInv.totalConteoRealizado = new Set(
            detallesGuardados.map(detalleGuardado => detalleGuardado.numeroConteo)
          ).size;
          conteoInv.estado = await this.calcularEstadoConteoAdmin(
            qr,
            estanteProductoId,
            Number(ultimoDetalle.cantidadContada)
          );
          conteoInv.numeroConteoCoincidente = ultimoDetalle.coincidenciaSistema
            ? ultimoDetalle.numeroConteo
            : null;
          await conteoInventarioRp.save(conteoInv);
        }
      }
      await qr.commitTransaction();
      return true;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  private async calcularEstadoConteoAdmin(
    qr: QueryRunner,
    estanteProductoId: number,
    cantidadContada: number
  ): Promise<EstadoConteoCode> {
    const productoEstanteRp = qr.manager.getRepository(ProductoEstantesOrm);
    const productoRp = qr.manager.getRepository(ProductoOrm);

    const estanteProducto = await productoEstanteRp.findOne({
      where: { id: estanteProductoId },
      relations: ['producto'],
    });

    if (!estanteProducto) {
      throw new BadRequestException(`El producto-estante ${estanteProductoId} no existe`);
    }

    const producto = await productoRp.findOne({
      where: { id: estanteProducto.productId },
      relations: ['existencias'],
    });

    if (!producto) {
      throw new BadRequestException(
        `El producto asociado al estante-producto ${estanteProductoId} no existe`
      );
    }

    const existenciaGlobal = (producto.existencias ?? []).reduce(
      (acc, e) => acc + Number(e.cantidad),
      0
    );
    const existenciaSistema = calcularExistenciaBaseConteo(estanteProducto.stock, existenciaGlobal);

    const diferencia = Number(cantidadContada) - Number(existenciaSistema);

    if (diferencia === 0) {
      return ESTADO_CONTEO.AJUSTADO.getCode();
    } else if (diferencia > 0) {
      return ESTADO_CONTEO.SOBRANTE.getCode();
    } else {
      return ESTADO_CONTEO.FALTANTE.getCode();
    }
  }
}
