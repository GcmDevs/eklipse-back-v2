import { BadRequestException, Injectable } from '@nestjs/common';
import {
  fetchPacientesByReferencia,
  fetchPacientesByHospitalizacion,
  selectPacienteFromHpn,
} from './referencia.queries';
import { Between } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import { CamaOrm, SolicitudReferenciaOrm } from '../orm';
import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { UsuarioOrm } from '@hpn/old/orm/general';
import { estadoCamaTypeFactory, ESTADOS_CAMA, MOTIVOS_BLOQUEO } from '../types';

export interface PacienteReferidoI {
  OID: number;
  CONSECUTIVO: number;
  CEDULA: number;
  ENTI_REFERENCIA: string;
  MOT_REMI: string;
  MOT_REMI2: string;
  MUNICIPIO: string;
  PACIENTE: string;
  FECHA_RESERVA: string;
  CREADA_POR: string;
  ORIGEN: 1 | 2;
  DIAGNOSTICO: string | null;
}

@Injectable()
export class ReferenciaSource extends BaseSource {
  public async fetchByPattern(pattern: string, origen: 1 | 2, context: GcmContexts) {
    const qr = this.dynamicQR(gcmContextFactory(context));
    await qr.connect();

    let pacientes: PacienteReferidoI[];

    if (origen == 2) {
      pacientes = await qr.manager.query(fetchPacientesByReferencia(pattern));
    } else {
      pacientes = await qr.manager.query(fetchPacientesByHospitalizacion(pattern));
    }

    await qr.release();

    return pacientes;
  }

  public async anularReservaCama(payload: {
    context: GcmContexts;
    camaId: number;
    consecutivo: number;
    origen: number;
    motivo: number;
    observacion: string;
  }) {
    const qr = this.dynamicQR(gcmContextFactory(payload.context));
    await qr.connect();
    await qr.startTransaction();
    try {
      const camaRp = qr.manager.getRepository(CamaOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudReferenciaOrm);
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);

      const auth = await usuarioRp.findOne({ where: { cedula: this.auth.user.document } });

      if (!auth) throw new Error('Requiere tener un usuario en este contexto');

      const solicitud: any[] = await qr.manager.query(
        payload.origen === 2
          ? fetchPacientesByReferencia(null, payload.consecutivo)
          : selectPacienteFromHpn(payload.consecutivo)
      );

      if (!solicitud.length) throw new Error('No hay una solicitud valida con este consecutivo');

      const reservaActiva = await solicitudRp.findOne({
        where: { solicitudId: solicitud[0].OID, isActiva: true },
      });

      const cama = await camaRp.findOne({ where: { id: payload.camaId } });

      if (!cama) throw new Error('No existe cama con este id');

      if (!reservaActiva) {
        return {
          success: false,
          estadoCode: cama.estadoCode,
          motivoBloqueoCode: cama.motivoBloqueoCode,
        };
      }
      if (!payload.observacion && payload.motivo === 2)
        throw new Error('La observación es obligatoria');

      // const now = new Date().getTime();
      // const diffMax = 14400000;

      // const diff = now - reservaActiva.createdAt.getTime();

      // if (diff > diffMax && payload.motivo === 2) {
      //   throw new Error('No puede cancelar la reserva despues de 4 horas');
      // }

      if (reservaActiva.CamaId !== cama.id) {
        throw new Error('La cama reservada no coincide con el usuario');
      }

      if (
        cama.estadoCode === ESTADOS_CAMA.BLOQUEADA.getCode() &&
        cama.motivoBloqueoCode === MOTIVOS_BLOQUEO.RESERVA.getCode()
      ) {
        //
      } else {
        throw new Error('Esta cama ya no está en estado de reserva');
      }

      reservaActiva.anuladaAt = new Date();
      reservaActiva.anuladaById = auth.id;
      reservaActiva.motivoAnulacion = payload.motivo;
      reservaActiva.anulacionObservacion = payload.observacion;
      reservaActiva.isActiva = false;

      const reservaStored = await solicitudRp.save(reservaActiva);

      if (payload.motivo === 1) {
        cama.estadoCode = ESTADOS_CAMA.DESOCUPADA.getCode();
        cama.motivoBloqueoCode = MOTIVOS_BLOQUEO.NINGUNO.getCode();
      }
      if (payload.motivo === 2) {
        cama.estadoCode = reservaActiva.estadoOriginalCode;
        cama.motivoBloqueoCode = reservaActiva.motivoBloqueoOriginalCode;
      }

      await camaRp.save(cama);

      await qr.commitTransaction();

      return {
        success: true,
        estadoCode: cama.estadoCode,
        motivoBloqueoCode: cama.motivoBloqueoCode,
      };
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async reservarCama(payload: {
    context: GcmContexts;
    camaId: number;
    consecutivo: number;
    origen: 1 | 2;
    tipoAislamiento?: number[];
    observacion: string;
  }) {
    if (payload.origen == 2) {
      try {
        return this._reservaReferencia(payload);
      } catch (error) {
        throw new Error(error.message);
      }
    } else {
      try {
        return this._reservaHospitalizacion(payload);
      } catch (error) {
        throw new Error(error.message);
      }
    }
  }

  private async _reservaHospitalizacion(payload: {
    context: GcmContexts;
    camaId: number;
    consecutivo: number;
    observacion: string;
    tipoAislamiento?: number[];
  }) {
    const qr = this.dynamicQR(gcmContextFactory(payload.context));
    await qr.connect();
    await qr.startTransaction();
    try {
      const camaRp = qr.manager.getRepository(CamaOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudReferenciaOrm);
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);

      const auth = await usuarioRp.findOne({ where: { cedula: this.auth.user.document } });

      if (!auth) {
        throw new Error('Requiere tener un usuario en este contexto');
      }

      const solicitud: any[] = await qr.manager.query(selectPacienteFromHpn(payload.consecutivo));

      if (!solicitud.length) {
        throw new Error('No hay un ingreso valido con este consecutivo');
      }

      const cama = await camaRp.findOne({ where: { id: payload.camaId } });

      if (
        cama.estadoCode !== ESTADOS_CAMA.DESOCUPADA.getCode() &&
        cama.estadoCode !== ESTADOS_CAMA.MANTENIMIENTO.getCode()
      ) {
        const estadoForHumans =
          cama.estadoCode === ESTADOS_CAMA.BLOQUEADA.getCode() &&
          cama.motivoBloqueoCode === MOTIVOS_BLOQUEO.RESERVA.getCode()
            ? 'RESERVADA'
            : estadoCamaTypeFactory(cama.estadoCode).getForHumans();

        if (estadoForHumans !== 'RESERVADA') {
          throw new Error(`No se puede reservar la cama en estado ${estadoForHumans}`);
        }
      }

      let reservaActiva = await solicitudRp.findOne({
        where: { CamaId: cama.id, isActiva: true },
      });

      if (reservaActiva) {
        if (
          cama.estadoCode === ESTADOS_CAMA.BLOQUEADA.getCode() &&
          cama.motivoBloqueoCode === MOTIVOS_BLOQUEO.RESERVA.getCode()
        ) {
          const solicitud: any[] = await qr.manager.query(
            reservaActiva.origenSolicitudCode === 2
              ? fetchPacientesByReferencia(null, null, reservaActiva.solicitudId)
              : selectPacienteFromHpn(undefined, reservaActiva.solicitudId)
          );
          return { success: false, reserva: reservaActiva, solicitud };
        } else {
          reservaActiva.isActiva = false;

          await solicitudRp.save(reservaActiva);
        }
      }

      reservaActiva = await solicitudRp.findOne({
        where: { solicitudId: solicitud[0].OID, origenSolicitudCode: 1, isActiva: true },
      });

      if (reservaActiva) {
        const camaActiva = await camaRp.findOne({ where: { id: reservaActiva.CamaId } });
        if (
          camaActiva.estadoCode === ESTADOS_CAMA.BLOQUEADA.getCode() &&
          camaActiva.motivoBloqueoCode === MOTIVOS_BLOQUEO.RESERVA.getCode()
        ) {
          throw new Error(
            `El paciente ya tiene la cama ${camaActiva.codigo} (${cama.nombre}) reservada`
          );
        } else {
          reservaActiva.isActiva = false;
          await solicitudRp.save(reservaActiva);
        }
      }

      const reserva = new SolicitudReferenciaOrm();
      reserva.estadoOriginalCode = cama.estadoCode;
      reserva.motivoBloqueoOriginalCode = cama.motivoBloqueoCode;
      reserva.CamaId = cama.id;
      reserva.createdAt = new Date();
      reserva.isActiva = true;
      reserva.createdById = auth.id;
      reserva.solicitudId = solicitud[0].OID;
      reserva.origenSolicitudCode = 1;
      reserva.isActiva = true;
      reserva.observacion = payload.observacion;
      reserva.tipoAislamiento = payload.tipoAislamiento.map(code => code.toString()).join(',');

      const reservaStored = await solicitudRp.save(reserva);

      cama.estadoCode = ESTADOS_CAMA.BLOQUEADA.getCode();
      cama.motivoBloqueoCode = MOTIVOS_BLOQUEO.RESERVA.getCode();

      await camaRp.save(cama);

      await qr.commitTransaction();

      return { success: true, reserva: reservaStored };
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  private async _reservaReferencia(payload: {
    context: GcmContexts;
    camaId: number;
    consecutivo: number;
    observacion: string;
    tipoAislamiento?: number[];
  }) {
    const qr = this.dynamicQR(gcmContextFactory(payload.context));
    await qr.connect();
    await qr.startTransaction();
    try {
      const camaRp = qr.manager.getRepository(CamaOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudReferenciaOrm);
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);

      const auth = await usuarioRp.findOne({ where: { cedula: this.auth.user.document } });

      if (!auth) {
        throw new Error('Requiere tener un usuario en este contexto');
      }

      const solicitud: any[] = await qr.manager.query(
        fetchPacientesByReferencia(payload.consecutivo.toString(), null)
      );

      if (!solicitud.length) {
        throw new Error('No hay una solicitud valida con este consecutivo');
      }

      const fechaSolicitud = new Date(solicitud[0].FECHA_SOL);
      const fechaIngreso = solicitud[0].FECHA_SOL ? new Date(solicitud[0].FECHA_SOL) : null;
      solicitud[0].FECHA_SOL = fechaSolicitud;
      solicitud[0].FECHA_INGRESO = fechaIngreso;
      if (fechaIngreso) {
        solicitud[0].YA_FUE_ACOSTADO =
          solicitud[0].INGRESO && solicitud[0].CAMA && fechaIngreso < fechaSolicitud;
      } else {
        solicitud[0].YA_FUE_ACOSTADO = false;
      }

      if (solicitud[0].YA_FUE_ACOSTADO) {
        throw new Error('El paciente ya fue acostado');
      }

      const cama = await camaRp.findOne({ where: { id: payload.camaId } });

      if (
        cama.estadoCode !== ESTADOS_CAMA.DESOCUPADA.getCode() &&
        cama.estadoCode !== ESTADOS_CAMA.MANTENIMIENTO.getCode()
      ) {
        const estadoForHumans =
          cama.estadoCode === ESTADOS_CAMA.BLOQUEADA.getCode() &&
          cama.motivoBloqueoCode === MOTIVOS_BLOQUEO.RESERVA.getCode()
            ? 'RESERVADA'
            : estadoCamaTypeFactory(cama.estadoCode).getForHumans();

        if (estadoForHumans !== 'RESERVADA') {
          throw new Error(`No se puede reservar la cama en estado ${estadoForHumans}`);
        }
      }

      let reservaActiva = await solicitudRp.findOne({
        where: { CamaId: cama.id, isActiva: true },
      });

      if (reservaActiva) {
        if (
          cama.estadoCode === ESTADOS_CAMA.BLOQUEADA.getCode() &&
          cama.motivoBloqueoCode === MOTIVOS_BLOQUEO.RESERVA.getCode()
        ) {
          const solicitud: any[] = await qr.manager.query(
            reservaActiva.origenSolicitudCode === 2
              ? fetchPacientesByReferencia(null, null, reservaActiva.solicitudId)
              : selectPacienteFromHpn(undefined, reservaActiva.solicitudId)
          );

          return { success: false, reserva: reservaActiva, solicitud };
        } else {
          reservaActiva.isActiva = false;
          await solicitudRp.save(reservaActiva);
        }
      }

      reservaActiva = await solicitudRp.findOne({
        where: { solicitudId: solicitud[0].OID, origenSolicitudCode: 2, isActiva: true },
      });

      if (reservaActiva) {
        const camaActiva = await camaRp.findOne({ where: { id: reservaActiva.CamaId } });
        if (
          camaActiva.estadoCode === ESTADOS_CAMA.BLOQUEADA.getCode() &&
          camaActiva.motivoBloqueoCode === MOTIVOS_BLOQUEO.RESERVA.getCode()
        ) {
          throw new Error(
            `El paciente ya tiene la cama ${camaActiva.codigo} (${cama.nombre}) reservada`
          );
        } else {
          reservaActiva.isActiva = false;
          await solicitudRp.save(reservaActiva);
        }
      }

      const reserva = new SolicitudReferenciaOrm();
      reserva.estadoOriginalCode = cama.estadoCode;
      reserva.motivoBloqueoOriginalCode = cama.motivoBloqueoCode;
      reserva.CamaId = cama.id;
      reserva.createdAt = new Date();
      reserva.isActiva = true;
      reserva.createdById = auth.id;
      reserva.solicitudId = solicitud[0].OID;
      reserva.origenSolicitudCode = 2;
      reserva.isActiva = true;
      reserva.tipoAislamiento = payload.tipoAislamiento.map(code => code.toString()).join(',');
      reserva.observacion = payload.observacion;

      const reservaStored = await solicitudRp.save(reserva);

      cama.estadoCode = ESTADOS_CAMA.BLOQUEADA.getCode();
      cama.motivoBloqueoCode = MOTIVOS_BLOQUEO.RESERVA.getCode();

      await camaRp.save(cama);

      await qr.commitTransaction();

      return { success: true, reserva: reservaStored };
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  async alertReservas(context: GcmContexts) {
    const qr = this.dynamicQR(gcmContextFactory(context));
    await qr.connect();
    // await qr.startTransaction();
    try {
      const solicitudRp = qr.manager.getRepository(SolicitudReferenciaOrm);
      const camaRp = qr.manager.getRepository(CamaOrm);

      const ahora = new Date();

      const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const ultimoDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

      const solicitudes = await solicitudRp.find({
        where: {
          isActiva: true,
          anuladaAt: null,
          createdAt: Between(primerDiaDelMes, ultimoDiaDelMes),
        },
      });

      const alertas: { origen: string; message: string; cama: string }[] = [];

      for (const solicitud of solicitudes) {
        const horasTranscurridas =
          (ahora.getTime() - new Date(solicitud.createdAt).getTime()) / (1000 * 60 * 60);

        const cama = await camaRp.findOne({ where: { id: solicitud.CamaId } });

        const origen =
          solicitud.origenSolicitudCode === 1
            ? 'Demanda Interna'
            : solicitud.origenSolicitudCode === 2
              ? 'Referencia'
              : 'Desconocido';

        let message = '';

        if (solicitud.origenSolicitudCode === 1 && horasTranscurridas >= 6) {
          message = `Han pasado ${Math.floor(
            horasTranscurridas
          )} horas desde la solicitud de ${origen} para la cama ${
            cama.codigo
          }. Debe confirmar o anular la reserva.`;
        }

        if (solicitud.origenSolicitudCode === 2 && horasTranscurridas >= 24) {
          message = `Han pasado ${Math.floor(
            horasTranscurridas
          )} horas desde la solicitud de ${origen} para la cama ${
            cama.codigo
          }. Debe confirmar o anular la reserva.`;
        }

        if (message) {
          alertas.push({ origen, message, cama: cama.codigo });
        }
      }

      return alertas;
    } catch (error) {
      // await qr.rollbackTransaction(); // No se inició transacción
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
