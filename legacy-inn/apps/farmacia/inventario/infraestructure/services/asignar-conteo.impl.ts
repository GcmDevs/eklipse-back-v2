import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { In, Like } from 'typeorm';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { ROL_CONTEO_USUARIO, RolUsuarioConteoCode, ESTADO_CONTEO } from '@ctypes/inn/inventario';
import { CrearAsignacionConteoDto } from '@farmacia/inventario/dto/inventarios.dto';
import {
  AsignacionConteoOrm,
  EstanteInventarioOrm,
  UsuarioConteoOrm,
  CicloInventarioOrm,
  ConteoInventarioOrm,
  ProductoEstantesOrm,
  DetalleConteoOrm,
} from '@orm/inn/inventario';
import { UsuarioOrm } from '@orm/gen';
import { AsignacionConteoMapper } from '@farmacia/inventario/mapper/asignacion-conteo.mapper';
import { UsuarioConteoMapper } from '@farmacia/inventario/mapper/usuario-conteo.mapper';
import {
  calcularEstadoTrasRestablecerConteo,
  esNumeroConteoAsignable,
} from '../../inventario.policies';

@Injectable()
export class AsignacionConteoImpl extends BaseSource {
  private readonly CONTEO_USUARIO_LIMITS = {
    1: 5, //13479
    2: 5,
  };
  private readonly CONTEO_ROL_MAP = {
    1: [ROL_CONTEO_USUARIO.CONTEO_I.getCode()],
    2: [ROL_CONTEO_USUARIO.CONTEO_II.getCode()],
  };

  public async restablecerConteo(asignacionId: number) {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();

    try {
      await qr.startTransaction();

      const asignacionRepo = qr.manager.getRepository(AsignacionConteoOrm);
      const usuarioConteoRepo = qr.manager.getRepository(UsuarioConteoOrm);
      const productoEstanteRepo = qr.manager.getRepository(ProductoEstantesOrm);
      const conteoRepo = qr.manager.getRepository(ConteoInventarioOrm);
      const detalleRepo = qr.manager.getRepository(DetalleConteoOrm);
      const estanteRepo = qr.manager.getRepository(EstanteInventarioOrm);

      const asignacion = await asignacionRepo.findOne({
        where: { id: asignacionId },
        relations: ['ciclo'],
      });

      if (!asignacion) throw new NotFoundException('La asignacion de conteo no existe');
      if (!asignacion.cicloId) {
        throw new BadRequestException('La asignacion no tiene un ciclo asociado');
      }
      if (asignacion.ciclo?.estado !== 'ABIERTO') {
        throw new BadRequestException('No se puede restablecer un conteo de un ciclo cerrado');
      }

      const productos = await productoEstanteRepo.find({
        where: { estanteId: asignacion.estanteId },
      });
      const productosIds = productos.map(producto => producto.id);
      if (!productosIds.length) {
        throw new BadRequestException('El estante de la asignacion no tiene productos');
      }

      const conteos = await conteoRepo.find({
        where: {
          cicloId: asignacion.cicloId,
          estanteProductoId: In(productosIds),
        },
        relations: ['detalleConteo'],
      });

      const conteosObjetivo = conteos.filter(conteo =>
        (conteo.detalleConteo ?? []).some(
          detalle =>
            detalle.usuarioId === asignacion.usuarioId &&
            detalle.numeroConteo === asignacion.numeroConteo
        )
      );
      const detallesObjetivo = conteosObjetivo.flatMap(conteo =>
        (conteo.detalleConteo ?? []).filter(
          detalle =>
            detalle.usuarioId === asignacion.usuarioId &&
            detalle.numeroConteo === asignacion.numeroConteo
        )
      );

      if (!detallesObjetivo.length) {
        throw new BadRequestException(
          `El usuario no tiene registros del conteo ${asignacion.numeroConteo} para restablecer`
        );
      }

      const tieneConteosPosteriores = conteosObjetivo.some(conteo =>
        (conteo.detalleConteo ?? []).some(detalle => detalle.numeroConteo > asignacion.numeroConteo)
      );
      if (tieneConteosPosteriores) {
        throw new BadRequestException(
          `No se puede restablecer el conteo ${asignacion.numeroConteo} porque existen conteos posteriores`
        );
      }

      const detallesObjetivoIds = new Set(detallesObjetivo.map(detalle => detalle.id));
      await detalleRepo.delete([...detallesObjetivoIds]);

      const conteosAfectados = conteosObjetivo;
      const ahora = new Date();

      for (const conteo of conteosAfectados) {
        const restantes = (conteo.detalleConteo ?? []).filter(
          detalle => !detallesObjetivoIds.has(detalle.id)
        );
        const estado = calcularEstadoTrasRestablecerConteo(restantes);
        Object.assign(conteo, estado, {
          closedAt: estado.isCerrado ? conteo.closedAt : null,
          updatedAt: ahora,
        });
      }
      await conteoRepo.save(conteosAfectados);

      asignacion.isActivo = true;
      asignacion.updatedAt = ahora;
      await asignacionRepo.save(asignacion);
      await usuarioConteoRepo.update(
        { id: asignacion.usuarioId },
        {
          isActive: true,
          roles: asignacion.numeroConteo as RolUsuarioConteoCode,
          updatedAt: ahora,
        }
      );
      await estanteRepo.update(
        { id: asignacion.estanteId },
        { estado: 'PROGRESO', updatedAt: ahora }
      );

      await qr.commitTransaction();

      return {
        message: `Conteo ${asignacion.numeroConteo} restablecido correctamente`,
        asignacionId: asignacion.id,
        usuarioConteoId: asignacion.usuarioId,
        cicloId: asignacion.cicloId,
        estanteId: asignacion.estanteId,
        numeroConteo: asignacion.numeroConteo,
        productosRestablecidos: conteosAfectados.length,
        detallesEliminados: detallesObjetivo.length,
      };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  public async asignarConteo(dto: CrearAsignacionConteoDto) {
    const { usuariosIds, estanteId, numeroConteo, contextCode } = dto;
    // ==============mejorar este codigo luego ================== //

    const ctx = gcmContextFactory(contextCode);

    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();
      const now = new Date();

      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);
      const usuarioConteoRp = qr.manager.getRepository(UsuarioConteoOrm);
      const conteoAsignacionRp = qr.manager.getRepository(AsignacionConteoOrm);
      // 1️⃣ Validar número de conteo
      if (!esNumeroConteoAsignable(numeroConteo)) {
        throw new BadRequestException('Solo se pueden asignar los conteos 1 y 2');
      }

      // 2️⃣ Validar máximo de usuarios permitidos por conteo
      const maxUsuarios = this.CONTEO_USUARIO_LIMITS[numeroConteo];
      if (usuariosIds.length > maxUsuarios) {
        throw new BadRequestException(
          `El conteo ${numeroConteo} solo permite máximo ${maxUsuarios} usuario(s)`
        );
      }

      // 3️⃣ Validar que el estante exista
      const estante = await estanteRp.findOne({
        where: { id: estanteId },
        relations: ['almacen'],
      });

      if (!estante) {
        throw new BadRequestException('El estante no existe');
      }

      estante.estado = 'PROGRESO';

      await estanteRp.save(estante);

      // 4️⃣ Traer los UsuarioConteo (ACTIVOS o INACTIVOS) por id
      //    Ojo: acá los ids que vienen en usuariosIds son los de EKINNUSUARIOCONTEO (OID)
      const usuariosConteo = await usuarioConteoRp.find({
        where: { id: In(usuariosIds) },
        relations: ['usuario'],
      });

      if (usuariosConteo.length !== usuariosIds.length) {
        throw new NotFoundException(
          'Uno o más usuarios no están registrados como usuarios de conteo'
        );
      }

      // 5️⃣ Asegurar/Asignar que tengan el rol adecuado según el número de conteo
      const allowedRoleCodes = this.CONTEO_ROL_MAP[numeroConteo];
      const roleToAssign = allowedRoleCodes[0] as RolUsuarioConteoCode;

      // Usuarios que no tengan ya el rol requerido
      const usuariosSinRol = usuariosConteo.filter(u => {
        return u.roles !== roleToAssign;
      });

      if (usuariosSinRol.length > 0) {
        const idsParaActualizar = usuariosSinRol.map(u => u.id);

        // Actualizar en BD los roles para que tengan permiso de conteo correspondiente
        const usuarioActualizado = await usuarioConteoRp.update(
          { id: In(idsParaActualizar) },
          { roles: roleToAssign, updatedAt: new Date() }
        );

        // Actualizar la copia en memoria para seguir el flujo
        for (const u of usuariosConteo) {
          if (idsParaActualizar.includes(u.id)) {
            u.roles = roleToAssign;
            u.updatedAt = now;
          }
        }
      }

      // 6️⃣ REACTIVAR usuarios que estaban inactivos para esta nueva jornada
      const usuariosInactivos = usuariosConteo.filter(u => !u.isActive);

      if (usuariosInactivos.length > 0) {
        const idsReactivar = usuariosInactivos.map(u => u.id);
        await usuarioConteoRp.update({ id: In(idsReactivar) }, { isActive: true, updatedAt: now });
        // Mantener coherencia en memoria
        for (const u of usuariosConteo) {
          if (idsReactivar.includes(u.id)) u.isActive = true;
        }
      }

      // 7️⃣ Validar que no existan asignaciones previas para ese estante y ese número de conteo
      const asignacionConteo = await conteoAsignacionRp.find({
        where: { estanteId, numeroConteo, isActivo: true },
      });

      if (asignacionConteo.length > 0) {
        throw new BadRequestException(
          `Ya existen asignaciones para el estante ${estante.nombreEstante} en el conteo ${numeroConteo}`
        );
      }

      // 8️⃣ Crear nuevo ciclo y nuevas asignaciones de conteo
      const cicloRepo = qr.manager.getRepository(CicloInventarioOrm);
      const productoEstanteRepo = qr.manager.getRepository(ProductoEstantesOrm);
      const conteoRepo = qr.manager.getRepository(ConteoInventarioOrm);

      // Reusar ciclo abierto existente para este estante (cubre los conteos 1,2,3)
      let savedCiclo = await cicloRepo.findOne({ where: { estanteId, estado: 'ABIERTO' } });

      let isNuevoCiclo = false;

      if (!savedCiclo) {
        isNuevoCiclo = true;

        const nuevoCiclo = cicloRepo.create({
          nombre: `Ciclo - ${estante.nombreEstante} - ${now.toISOString()}`,
          estado: 'ABIERTO',
          inicio: now,
          createdAt: now,
          estanteId,
        });

        savedCiclo = await cicloRepo.save(nuevoCiclo);
      }

      const nuevasAsignaciones = usuariosIds.map(usuarioConteoId => {
        const nuevaAsignacion = new AsignacionConteoOrm();
        nuevaAsignacion.usuarioId = usuarioConteoId; // id de EKINNUSUARIOCONTEO
        nuevaAsignacion.estanteId = estanteId;
        nuevaAsignacion.numeroConteo = numeroConteo;
        nuevaAsignacion.cicloId = savedCiclo.id;
        nuevaAsignacion.fechaAsignacion = now;
        nuevaAsignacion.isActivo = true;
        nuevaAsignacion.updatedAt = now;

        return nuevaAsignacion;
      });

      await conteoAsignacionRp.save(nuevasAsignaciones);

      if (isNuevoCiclo) {
        // 9️⃣ Inicializar ConteoInventario para cada producto del estante (silencioso si ya existe)
        const productos = await productoEstanteRepo.find({ where: { estanteId } });
        const EST_PENDIENTE = ESTADO_CONTEO.PENDIENTE.getCode?.() ?? ESTADO_CONTEO.PENDIENTE;

        for (const p of productos) {
          try {
            const nuevoConteo = conteoRepo.create({
              estanteProductoId: p.id,
              estado: EST_PENDIENTE,
              totalConteoRealizado: 0,
              numeroConteoCoincidente: null,
              isCerrado: false,
              cantidadOficial: null,
              createdAt: now,
              updatedAt: now,
              cicloId: savedCiclo.id,
            } as any);

            await conteoRepo.save(nuevoConteo);
          } catch (err) {
            Logger.warn('Inicializar conteo falló (posible duplicado):', err.message);
          }
        }
      }

      await qr.commitTransaction();

      return true;
    } catch (error) {
      Logger.error('Error asignando conteo:', error);
      await qr.rollbackTransaction();

      // Re-lanzar las excepciones de Nest tal cual, o envolver otras en Error genérico
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async excute() {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const repo = qr.manager.getRepository(AsignacionConteoOrm);

      return await repo.find({
        relations: ['usuario', 'usuario.usuario', 'estante'],
        order: { id: 'ASC' },
      });
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async misAsignaciones() {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    const usuario = this.auth.user;

    try {
      const usuarioConteoRp = qr.manager.getRepository(UsuarioConteoOrm);
      const asignacionRp = qr.manager.getRepository(AsignacionConteoOrm);

      const usuarioConteo = await usuarioConteoRp.findOne({
        where: {
          usuarioId: usuario.id,
          isActive: true,
        },
      });

      if (!usuarioConteo) {
        throw new NotFoundException(
          'El usuario no está  habilitado para realizar conteos. Por favor, contacte al administrador.'
        );
      }

      const asignaciones = await asignacionRp.find({
        where: {
          usuarioId: usuarioConteo.id,
          isActivo: true,
          numeroConteo: In([1, 2]),
        },
        relations: ['estante', 'estante.almacen', 'ciclo'],
        order: {
          numeroConteo: 'DESC',
        },
      });

      if (!asignaciones.length) {
        throw new NotFoundException('No tienes asignaciones de conteo activas.');
      }

      return AsignacionConteoMapper.toMisAsignaciones(asignaciones);
    } catch (error: any) {
      Logger.error('Error fetching misAsignaciones:', error);
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async buscarUsuario(documento: string) {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);

      const usuario = await usuarioRp.findOne({
        where: { cedula: documento },
      });

      if (!usuario) {
        throw new NotFoundException('no existe usuario con ese documento');
      }

      return UsuarioConteoMapper.responseUsuario(usuario);
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
  public async buscarUsuarioAsignacion(nombre: string) {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const usuarioRp = qr.manager.getRepository(UsuarioConteoOrm);

      const usuarios = await usuarioRp.find({
        where: {
          usuario: {
            nombreCompleto: Like(`%${nombre}%`),
          },
        },
        relations: ['asignaciones', 'usuario', 'asignaciones.estante'],
      });

      if (usuarios.length === 0) {
        throw new NotFoundException('no existe usuario con ese nombre');
      }
      return UsuarioConteoMapper.responseUsuarioList(usuarios);
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async listarUsuariosConAsignacionActiva() {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

      // Obtener todos los estantes con sus asignaciones activas y usuarios
      const estantes = await estanteRp
        .createQueryBuilder('estante')
        .leftJoinAndSelect(
          'estante.asignaciones',
          'asignacion',
          'asignacion.isActivo = :isActivo',
          { isActivo: true }
        )
        .leftJoinAndSelect('asignacion.usuario', 'usuarioConteo')
        .leftJoinAndSelect('usuarioConteo.usuario', 'usuario')
        .orderBy('estante.nombreEstante', 'ASC')
        .addOrderBy('asignacion.numeroConteo', 'ASC')
        .getMany();

      let estantesConAlgunaAsignacion = 0;
      let estantesCompletamenteAsignados = 0;
      let estantesSinAsignacion = 0;

      const listaEstantes = estantes.map(estante => {
        const asignaciones = estante.asignaciones || [];
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

        // Mapear los usuarios por número de conteo (1, 2 y 3)
        const conteos = {
          conteo1: asignaciones
            .filter(a => a.numeroConteo === 1)
            .map(a => ({
              usuarioConteoId: a.usuario.id,
              nombre: a.usuario.usuario.nombreCompleto,
              cedula: a.usuario.usuario.cedula,
            })),
          conteo2: asignaciones
            .filter(a => a.numeroConteo === 2)
            .map(a => ({
              usuarioConteoId: a.usuario.id,
              nombre: a.usuario.usuario.nombreCompleto,
              cedula: a.usuario.usuario.cedula,
            })),
        };

        const tieneAsignacion = asignaciones.length > 0;
        const estaCompleto = conteos.conteo1.length > 0 && conteos.conteo2.length;

        if (!tieneAsignacion) {
          estantesSinAsignacion++;
        } else {
          estantesConAlgunaAsignacion++;
          if (estaCompleto) estantesCompletamenteAsignados++;
        }

        return {
          estanteId: estante.id,
          nombreEstante: estante.nombreEstante,
          estado: estante.estado,
          conteos,
          tieneAsignacion,
          estaCompleto,
        };
      });

      return {
        estantes: listaEstantes,
        statsGenerales: {
          totalEstantes: estantes.length,
          estantesConAsignacion: estantesConAlgunaAsignacion,
          estantesFaltantes: estantesSinAsignacion,
          estantesCompletos: estantesCompletamenteAsignados,
          porcentajeProgresoAsignacion:
            estantes.length > 0
              ? Math.round((estantesConAlgunaAsignacion / estantes.length) * 100)
              : 0,
        },
      };
    } finally {
      await qr.release();
    }
  }
}
