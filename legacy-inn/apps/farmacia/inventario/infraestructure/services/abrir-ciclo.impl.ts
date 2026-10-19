import { In } from 'typeorm';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { CicloInventarioOrm } from '@orm/inn/inventario/ciclo-inventario.orm';
import {
  AsignacionConteoOrm,
  EstanteInventarioOrm,
  UsuarioConteoOrm,
  ProductoEstantesOrm,
  ConteoInventarioOrm,
} from '@orm/inn/inventario';

@Injectable()
export class AbrirCicloImpl extends BaseSource {
  public async abrirCiclo(dto: {
    nombre: string;
    estanteId: number;
    usuarioConteoId: number[];
    numeroConteo: number;
  }) {
    const { nombre, estanteId, usuarioConteoId, numeroConteo } = dto;

    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      const cicloRepo = qr.manager.getRepository(CicloInventarioOrm);
      const asignRepo = qr.manager.getRepository(AsignacionConteoOrm);
      const estanteRepo = qr.manager.getRepository(EstanteInventarioOrm);
      const usuarioConteoRepo = qr.manager.getRepository(UsuarioConteoOrm);
      const productoEstanteRepo = qr.manager.getRepository(ProductoEstantesOrm);
      const conteoRepo = qr.manager.getRepository(ConteoInventarioOrm);

      const estante = await estanteRepo.findOne({ where: { id: estanteId } });
      if (!estante) throw new BadRequestException('Estante no encontrado');

      // Crear ciclo
      const nuevoCiclo = cicloRepo.create({ nombre, estado: 'ABIERTO', inicio: new Date() });
      const savedCiclo = await cicloRepo.save(nuevoCiclo);

      // Reactivar/asegurar usuario conteo
      await usuarioConteoRepo.update(
        { id: In(usuarioConteoId) },
        { isActive: true, updatedAt: new Date() }
      );
      let asign: AsignacionConteoOrm;
      // Crear asignación para el estante en el ciclo

      for (const uId of usuarioConteoId) {
        // Crear asignación para el estante en el ciclo
        asign = asignRepo.create({
          usuarioId: uId,
          estanteId,
          numeroConteo,
          isActivo: true,
          fechaAsignacion: new Date(),
          updatedAt: new Date(),
          cicloId: savedCiclo.id,
        });
        await asignRepo.save(asign);
      }

      // Marcar estante en progreso
      estante.estado = 'PROGRESO';
      await estanteRepo.save(estante);

      // (Opcional) Inicializar conteos para cada producto-estante como PENDIENTE
      const productos = await productoEstanteRepo.find({ where: { estanteId } });
      if (productos.length > 0) {
        const nuevosConteos = productos.map(p =>
          conteoRepo.create({
            estanteProductoId: p.id,
            estado: 1, // PENDIENTE (usar enum si está disponible)
            totalConteoRealizado: 0,
            numeroConteoCoincidente: null,
            isCerrado: false,
            cantidadOficial: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            cicloId: savedCiclo.id,
          })
        );

        // Guardar silenciosamente, ignorar duplicados si existen
        for (const c of nuevosConteos) {
          try {
            await conteoRepo.save(c);
          } catch (err) {
            Logger.warn('No se pudo crear conteo inicial, posiblemente existe:', err.message);
          }
        }
      }

      await qr.commitTransaction();

      return { ciclo: savedCiclo, asignacion: asign };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }
}
