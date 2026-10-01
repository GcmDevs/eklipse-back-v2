import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { fetchByConsecutivo } from './gestion-salida.queries';
import { GestionSalida, GestionSalidaResponse } from './gestion-salida.response';
import { GestionSalidaDto } from '../camas/application/dtos';
import { GestionSalidaOrm } from '../orm/gestion-salida.orm';

@Injectable()
export class GestionSalidaSource extends BaseSource {
  async getConsecutivoSalida(consecutivo: number, context: GcmContexts) {
    const qr = this.dynamicQR(gcmContextFactory(context));
    await qr.connect();
    try {
      const result: GestionSalidaResponse[] = await qr.manager.query(
        fetchByConsecutivo(consecutivo)
      );

      if (!result.length) throw new Error('No existe la salida');

      let response: GestionSalida;

      result.map(item => {
        response = {
          numeroSalida: item.SALIDA_NUMERO,
          fechaHoraSalida: item.FECHA_HORA_SALIDA,
          observacion: item.OBSERVACION,
          ingreso: item.INGRESO,
          cama: item.CAMA,
          servicio: item.SERVICIO,
          usuario: {
            id: item.ID_USUARIO,
            nombreUsuario: item.NOMBRE_USUARIO,
            cedulaUsuario: item.USUARIO_CREO_ORDEN_SALIDA,
            rol: item.ROL,
          },
          paciente: {
            cedulaPaciente: item.PACIENTE,
            nombrePaciente: item.NOMBRE_PACIENTE,
            fechaNacimiento: item.FECHA_NAC_PACIENTE,
          },
          plan: {
            codigoPlan: item.COD_PLAN,
            nombrePlan: item.NOMBRE_PLAN,
          },
        };
      });
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  async aprobarSalida(body: GestionSalidaDto, context: GcmContexts) {
    const qr = this.dynamicQR(gcmContextFactory(context));
    await qr.connect();
    await qr.startTransaction();

    try {
      const { consecutivo, fechaSalida, ingresoConsecutivo, usuCreoOrdenSalidaId } = body;

      const gestionSalidaRp = qr.manager.getRepository(GestionSalidaOrm);

      if (!consecutivo || !fechaSalida || !ingresoConsecutivo || !usuCreoOrdenSalidaId) {
        throw new Error('Todos los campos son requeridos');
      }

      const existingSalida = await gestionSalidaRp.findOne({
        where: { consecutivo, ingresoId: ingresoConsecutivo },
      });

      if (existingSalida) {
        throw new Error('Ya existe una orden de salida para este ingreso');
      }

      const gestionSalida = new GestionSalidaOrm();

      gestionSalida.consecutivo = consecutivo;
      gestionSalida.fechaSalida = fechaSalida;
      gestionSalida.ingresoId = ingresoConsecutivo;
      gestionSalida.usuCreoOrdenSalidaId = usuCreoOrdenSalidaId;
      gestionSalida.usuConfirmSalId = this.auth.id;
      gestionSalida.createdAt = new Date();

      await gestionSalidaRp.save(gestionSalida);

      await qr.commitTransaction();

      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  async fetchAll() {
    const qr = this.dynamicQR(gcmContextFactory(this.auth.context.getCode()));
    await qr.connect();
    try {
      const gestionSalidaRp = qr.manager.getRepository(GestionSalidaOrm);

      const result = await gestionSalidaRp.find({
        relations: ['usuCreoOrdenSalida', 'usuConfirmSal'],
        order: { id: 'DESC' },
      });

      if (!result.length) throw new Error('No hay salidas registradas');

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
