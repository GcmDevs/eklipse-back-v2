import { BaseSource } from '@common/infrastructure/services';
import { ESTADO_CONTEO } from '@ctypes/inn/inventario';
import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  AsignacionConteoOrm,
  CicloInventarioOrm,
  ConteoInventarioOrm,
  DetalleConteoOrm,
  EstanteInventarioOrm,
  ProductoEstantesOrm,
  UsuarioConteoOrm,
} from '@orm/inn/inventario';
import { In } from 'typeorm';
import { productoEstaAjustadoEnCiclo } from '../../inventario.policies';

@Injectable()
export class CerrarConteoImpl extends BaseSource {
  private readonly logger = new Logger(CerrarConteoImpl.name);

  public async cerrarConteo(estanteId: number) {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();

    try {
      await qr.startTransaction();

      const conteoRepo = qr.manager.getRepository(ConteoInventarioOrm);
      const usuarioConteoRepo = qr.manager.getRepository(UsuarioConteoOrm);
      const estanteRepo = qr.manager.getRepository(EstanteInventarioOrm);
      const asignacionRepo = qr.manager.getRepository(AsignacionConteoOrm);
      const productoEstanteRepo = qr.manager.getRepository(ProductoEstantesOrm);
      const cicloRepo = qr.manager.getRepository(CicloInventarioOrm);
      const estadoVerificar = ESTADO_CONTEO.VERIFICAR.getCode();

      const estante = await estanteRepo.findOne({ where: { id: estanteId } });
      if (!estante) throw new BadRequestException('Estante no encontrado');

      const usuarioConteo = await usuarioConteoRepo.findOne({
        where: { usuarioId: this.auth.id },
      });
      if (!usuarioConteo) {
        throw new ForbiddenException('El usuario no esta registrado como usuario de conteo');
      }

      const productosEstante = await productoEstanteRepo.find({
        where: { estanteId },
        relations: [
          'producto',
          'producto.existencias',
          'conteoInventario',
          'conteoInventario.detalleConteo',
        ],
      });
      const productosIds = productosEstante.map(producto => producto.id);
      if (!productosIds.length) {
        throw new BadRequestException('El estante no tiene productos asignados');
      }

      const conteosDelEstante = await conteoRepo.find({
        where: { estanteProductoId: In(productosIds) },
      });
      const conteosEnVerificacion = conteosDelEstante.filter(conteo => {
        if (conteo.estado !== estadoVerificar) return false;

        const producto = productosEstante.find(
          productoEstante => productoEstante.id === conteo.estanteProductoId
        );
        if (!producto || conteo.cicloId == null) return true;

        return !productoEstaAjustadoEnCiclo(
          producto,
          conteo.cicloId,
          ESTADO_CONTEO.AJUSTADO.getCode()
        );
      });
      if (conteosEnVerificacion.length) {
        const productosAlerta = conteosEnVerificacion
          .map(conteo => conteo.estanteProductoId)
          .join(', ');
        throw new BadRequestException(
          `No se puede cerrar el estante porque hay productos por verificar: ${productosAlerta}`
        );
      }

      const ciclosAbiertos = await cicloRepo.find({
        where: { estanteId, estado: 'ABIERTO' },
      });
      if (ciclosAbiertos.length) {
        await cicloRepo.update(
          { id: In(ciclosAbiertos.map(ciclo => ciclo.id)) },
          { estado: 'CERRADO', fin: new Date() }
        );
      }

      estante.estado = 'PENDIENTE';
      await estanteRepo.save(estante);

      const asignaciones = await asignacionRepo.find({
        where: { estanteId, isActivo: true },
      });
      if (asignaciones.length) {
        await asignacionRepo.update(
          { id: In(asignaciones.map(asignacion => asignacion.id)) },
          { isActivo: false, updatedAt: new Date() }
        );
      }

      const usuarioConteoIds = [...new Set(asignaciones.map(asignacion => asignacion.usuarioId))];
      for (const usuarioConteoId of usuarioConteoIds) {
        const otrasAsignacionesActivas = await asignacionRepo.count({
          where: { usuarioId: usuarioConteoId, isActivo: true },
        });
        await usuarioConteoRepo.update(
          { id: usuarioConteoId },
          {
            roles: null as any,
            isActive: otrasAsignacionesActivas > 0,
            updatedAt: new Date(),
          }
        );
      }

      await qr.commitTransaction();
      return {
        message: 'Estante cerrado exitosamente.',
        estanteId,
        ciclosCerrados: ciclosAbiertos.length,
        usuariosDesactivados: usuarioConteoIds.length,
      };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  public async reiniciarConteos() {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    let transaccionIniciada = false;

    try {
      await qr.startTransaction();
      transaccionIniciada = true;

      const detalleRepo = qr.manager.getRepository(DetalleConteoOrm);
      const conteoRepo = qr.manager.getRepository(ConteoInventarioOrm);
      const cicloRepo = qr.manager.getRepository(CicloInventarioOrm);
      const asignacionRepo = qr.manager.getRepository(AsignacionConteoOrm);
      const usuarioConteoRepo = qr.manager.getRepository(UsuarioConteoOrm);
      const estanteRepo = qr.manager.getRepository(EstanteInventarioOrm);

      // Operaciones masivas sin listas de IDs: evita el límite de 2100
      // parámetros de SQL Server cuando la base de producción tiene muchos registros.
      const resultadoDetalles = await detalleRepo.createQueryBuilder().delete().execute();
      const resultadoConteos = await conteoRepo.createQueryBuilder().delete().execute();

      const ahora = new Date();
      const resultadoCiclos = await cicloRepo
        .createQueryBuilder()
        .update()
        .set({ estado: 'CERRADO', fin: ahora })
        .where('ESTADO = :estado', { estado: 'ABIERTO' })
        .execute();

      const resultadoAsignaciones = await asignacionRepo
        .createQueryBuilder()
        .update()
        .set({ isActivo: false, updatedAt: ahora })
        .where('ISACTIVO = :isActivo', { isActivo: true })
        .execute();

      const resultadoUsuarios = await usuarioConteoRepo
        .createQueryBuilder()
        .update()
        .set({ isActive: false, roles: null as any, updatedAt: ahora })
        .where('1 = 1')
        .execute();

      const resultadoEstantes = await estanteRepo
        .createQueryBuilder()
        .update()
        .set({ estado: 'PENDIENTE', updatedAt: ahora })
        .where('1 = 1')
        .execute();

      await qr.commitTransaction();
      transaccionIniciada = false;

      return {
        message: 'Conteos reiniciados exitosamente. Se requieren nuevas asignaciones.',
        estantesReiniciados: resultadoEstantes.affected ?? 0,
        conteosEliminados: resultadoConteos.affected ?? 0,
        detallesEliminados: resultadoDetalles.affected ?? 0,
        ciclosCerrados: resultadoCiclos.affected ?? 0,
        asignacionesDesactivadas: resultadoAsignaciones.affected ?? 0,
        usuariosDesactivados: resultadoUsuarios.affected ?? 0,
      };
    } catch (error) {
      if (transaccionIniciada) {
        try {
          await qr.rollbackTransaction();
        } catch (rollbackError) {
          this.logger.error(
            `Falló el rollback del reinicio de conteos: ${this.obtenerMensajeError(rollbackError)}`
          );
        }
      }

      this.logger.error(
        `Falló el reinicio de conteos: ${this.obtenerMensajeError(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    } finally {
      await qr.release();
    }
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
