import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EstanteOrm,
  ProductoEstanteBasicOrm,
  ReporteOrm,
  VerificacionOrm,
} from '@orm/inn/productos/estantes';
import { BaseSource } from '@common/infrastructure/services';
import { TABLE_NAMES } from '@common/application/constants';
import { In, IsNull, MoreThan } from 'typeorm';
import { ExistenciaOrm } from '@orm/inn/productos';
import { UpdateExistenciaEstantePayload } from '@farmacia/inn-ciclico/application/payloads';

@Injectable()
export class UpdateExistenciaProductoImpl extends BaseSource {
  async execute(estanteId: number, body: UpdateExistenciaEstantePayload[]) {
    let transactionStarted = false;

    try {
      for (let index = 0; index < body.length; index++) {
        const el = body[index];
        await this.verifyEntityExist(TABLE_NAMES.inn.pdt.productos, el.productoId);
      }
      await this.verifyEntityExist(TABLE_NAMES.inn.pdt.stt.estantes, estanteId);

      transactionStarted = true;

      await this.qr.connect();
      await this.qr.startTransaction();

      const estanteRp = this.qr.manager.getRepository(EstanteOrm);
      const reporteRp = this.qr.manager.getRepository(ReporteOrm);
      const verificacionRp = this.qr.manager.getRepository(VerificacionOrm);
      const productoEstanteRp = this.qr.manager.getRepository(ProductoEstanteBasicOrm);
      const existenciaRp = this.qr.manager.getRepository(ExistenciaOrm);

      const estante = await estanteRp.findOne({
        where: { id: estanteId },
        relations: ['ultimaVerificacion', 'productos'],
      });

      const now = new Date();
      const minutosVerificacionValidaInMs = estante.minutosVerificacionValida * 60 * 1000;

      if (estante.ultimaVerificacion) {
        const tieDdUltVeriInMs = now.getTime() - estante.ultimaVerificacion.fechaCreacion.getTime();
        const tieDdUltVeriInInMin = tieDdUltVeriInMs / 1000 / 60;

        if (tieDdUltVeriInMs < minutosVerificacionValidaInMs) {
          throw new Error(
            `Han pasado ${Math.round(
              tieDdUltVeriInInMin
            )} minutos desde el ultimo conteo, debe esperar ${Math.round(
              estante.minutosVerificacionValida - tieDdUltVeriInInMin
            )} minutos mas para el proximo`
          );
        }
      }

      const verificacionActivaExist = await verificacionRp.findOne({
        where: { estanteId, verificadoPorId: IsNull() },
      });

      if (verificacionActivaExist) {
        const milisegundos = estante.minutosVerificacionValida * 60 * 1000;

        const lastVerificacionIsValid =
          now.getTime() - estante.ultimaVerificacion.fechaCreacion.getTime() < milisegundos;

        if (lastVerificacionIsValid) throw new Error('Ya existe un reporte sin verificar');
      }

      const newVerificacion = new VerificacionOrm();
      newVerificacion.fechaCreacion = new Date();
      newVerificacion.estanteId = estanteId;
      newVerificacion.creadoPorId = this.auth.id;

      const verificacionStored = await verificacionRp.save(newVerificacion);

      estante.ultimaVerificacion = verificacionStored;
      await estanteRp.save(estante);

      const productosEstante = await productoEstanteRp.find({
        where: { productoId: In(body.map(e => e.productoId)), estanteId },
      });

      const newEntities: ReporteOrm[] = [];

      for (let index = 0; index < body.length; index++) {
        const element = body[index];

        let existencias = await existenciaRp.find({
          where: { productoId: element.productoId, cantidad: MoreThan(0) },
        });

        let existenciaActual = 0;

        existencias.forEach(e => {
          existenciaActual += e.cantidad;
        });

        const newEntity = new ReporteOrm();
        newEntity.productoId = element.productoId;
        newEntity.verificacionId = verificacionStored.id;
        newEntity.stock = element.stock;
        newEntity.dimStock = existenciaActual;
        newEntities.push(newEntity);

        productosEstante.map(pe => {
          if (pe.productoId === element.productoId) {
            pe.stock = element.stock;
          }
        });
      }

      await reporteRp.save(newEntities);
      await productoEstanteRp.save(productosEstante);

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
