import { BadRequestException, Injectable } from '@nestjs/common';
import {
  TrasladoAsignacionOrm,
  TrasladoAsistencialOrm,
  TrasladoRevisionCentralOrm,
  TrasladoTramoOrm,
} from '@hpn/lgc/tas/orm/gcn';
import { ESTADOS_ASISTENCIA } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { CancelTrasladoDto, CreateRevisionCentralDto } from '@hpn/lgc/tas/presentation/dtos';
import { RecursosCompartidosSource } from '../services';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class TrasladoRevisionCentralImpl extends RecursosCompartidosSource {
  public async decidir(body: CreateRevisionCentralDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      // await this.getTrasladoOrFail(body.trasladoId);
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);

      const revisionRp = qr.manager.getRepository(TrasladoRevisionCentralOrm);

      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);

      /*   const traslado = await trasladoRp.findOne({
        where: {
          id: body.trasladoId,
          isDeleted: false,
        },
      });

      if (!traslado) {
        throw new Error(`No existe traslado con id ${body.trasladoId}  o se encuentra eliminado`);
      } */

      // const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      if (traslado.estadoCode !== ESTADOS_ASISTENCIA.FINALIZADO.getCode()) {
        throw new Error('El traslado debe estar finalizado para revision de central');
      }

      const nuevoEstado = body.aprobado
        ? ESTADOS_ASISTENCIA.APROBADO.getCode()
        : ESTADOS_ASISTENCIA.RECHAZADO.getCode();

      await revisionRp.save(
        revisionRp.create({
          trasladoId: body.trasladoId,
          usuarioCentralId: this.auth.id,
          resultadoCode: nuevoEstado,
          /*  motivo: body.motivo, */
          observacion: body.observacion,
          fecha: new Date(),
          centroProcesamiento: this.auth.context.getNumericCode(),
        })
      );

      traslado.estadoCode = nuevoEstado;

      await trasladoRp.save(traslado);

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: null,
        estadoCode: nuevoEstado,
        observacion: body.observacion,
        /*  motivoCancelacionCode: body.motivo, */
        qr,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async cancel(body: CancelTrasladoDto): Promise<boolean> {
    let transactionStarted = false;

    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));

    try {
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);

      const trasladoAsignacionRp = qr.manager.getRepository(TrasladoAsignacionOrm);

      const tramoRp = qr.manager.getRepository(TrasladoTramoOrm);

      const traslado = await trasladoRp.findOne({
        where: { id: body.trasladoId, isDeleted: false },
      });

      const trasladoAsignacion = await trasladoAsignacionRp.findOne({
        where: { trasladoId: body.trasladoId, isActiva: true },
      });

      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      if (!traslado) {
        throw new Error(`No existe traslado con id ${body.trasladoId}  o se encuentra eliminado`);
      }

      if (
        [
          ESTADOS_ASISTENCIA.CANCELADO.getCode(),
          ESTADOS_ASISTENCIA.APROBADO.getCode(),
          ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
        ].includes(traslado.estadoCode)
      ) {
        throw new Error(`El traslado ya se encuentra en un estado que no permite la cancelación`);
      }

      traslado.estadoCode = ESTADOS_ASISTENCIA.CANCELADO.getCode();

      if (trasladoAsignacion) {
        trasladoAsignacion.isActiva = false;
        trasladoAsignacion.estadoCode = ESTADOS_ASISTENCIA.CANCELADO.getCode();
        trasladoAsignacion.fechaDesasignacion = new Date();
        await trasladoAsignacionRp.save(trasladoAsignacion);
      }

      tramoActivo.estadoCode = ESTADOS_ASISTENCIA.CANCELADO.getCode();
      tramoActivo.isActivo = false;
      await tramoRp.save(tramoActivo);

      await trasladoRp.save(traslado);

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: ESTADOS_ASISTENCIA.CANCELADO.getCode(),
        observacion: body.observacion,
        motivoCancelacionCode: body.motivoCode,
        qr,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }
}
