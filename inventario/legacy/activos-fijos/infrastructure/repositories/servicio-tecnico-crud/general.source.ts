import { Injectable } from '@nestjs/common';
import {
  SSTItemOrm,
  SSTNotaOrm,
  SolicitudServicioTecnicoOrm,
  UsuarioTipoServicioTecnicoOrm,
} from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import {
  AfnClaseSerTecCode,
  afnClaseSerTecTypeFactory,
  AFNTIPO_SER_REC_TEC__ASIGNAR__,
  AFNTIPO_SER_REC_TEC__ATCSNA,
  AFNTIPO_SER_REC_TEC__SEEALL,
  AFNTIPO_SER_REC_TEC__TODOS__,
  AfnTipoSolSerTecCode,
  ESTADO_AFNITEM_SOL_SER_TEC,
  EstadoAfnItemSolSerTecType,
  estadoAfnItemSolSerTecTypeFactory,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { TABLE_NAMES } from '@common/application/constants';
import { ServicioTecnicoBaseSource } from '../../bases';
import { RSAServices } from '@common/application/services';
import { UsuarioOrm } from '@inn/lgc/afn/orm/gen';
import { In } from 'typeorm';

@Injectable()
export class SolicitudServicioTecnicoSource extends ServicioTecnicoBaseSource {
  public async asignarCaso(
    itemId: number,
    usuarioId: string,
    claseServicioTecnicoCode: AfnClaseSerTecCode,
    nota: string,
    tiempo: number,
    tipoFormato: number,
    fechaAtencionProgramada: Date,
    isTipoTarea: boolean
  ) {
    let isTransactionStarted = false;

    try {
      const usuarioIdDecoded = RSAServices.decryptId(usuarioId);

      await this.verifyEntityExist(TABLE_NAMES.gen.usu.usuarios, usuarioIdDecoded);
      await this.verifyEntityExist(TABLE_NAMES.inn.afn.svt.items, itemId);

      isTransactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();
      const itemRp = this.qr.manager.getRepository(SSTItemOrm);
      const usuSerTecRp = this.qr.manager.getRepository(UsuarioTipoServicioTecnicoOrm);
      const notaRp = this.qr.manager.getRepository(SSTNotaOrm);

      let misServiciosTecnicos: UsuarioTipoServicioTecnicoOrm[] = [],
        canAsignarCasos = false,
        includeAllServiciosTecnicos = false,
        isReasignarCaso = false;

      misServiciosTecnicos = await usuSerTecRp.find({ where: { usuarioId: this.auth.id } });

      const serviciosTecnicosUsuario = await usuSerTecRp.find({
        where: { usuarioId: usuarioIdDecoded },
      });

      const serviciosTecnicosCodes: number[] = [];
      const usuarioServiciosTecnicosCodes: number[] = [];

      misServiciosTecnicos.forEach(s => {
        if (
          [
            AFNTIPO_SER_REC_TEC__SEEALL.getCode(),
            AFNTIPO_SER_REC_TEC__ATCSNA.getCode(),
            AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode(),
            AFNTIPO_SER_REC_TEC__TODOS__.getCode(),
          ].indexOf(s.tipoServicioTecnicoCode) < 0
        ) {
          serviciosTecnicosCodes.push(s.tipoServicioTecnicoCode);
        }
        if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode()) {
          canAsignarCasos = true;
        }
        if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__TODOS__.getCode()) {
          includeAllServiciosTecnicos = true;
        }
      });

      let usuarioIncludeAllServiciosTecnicos = false;

      serviciosTecnicosUsuario.forEach(s => {
        if (
          [
            AFNTIPO_SER_REC_TEC__SEEALL.getCode(),
            AFNTIPO_SER_REC_TEC__ATCSNA.getCode(),
            AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode(),
          ].indexOf(s.tipoServicioTecnicoCode) < 0
        ) {
          usuarioServiciosTecnicosCodes.push(s.tipoServicioTecnicoCode);
        }
        if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__TODOS__.getCode()) {
          usuarioIncludeAllServiciosTecnicos = true;
        }
      });

      const item = await itemRp.findOne({ where: { id: itemId }, relations: ['notas'] });

      if (
        [
          ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA.getCode(),
          ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode(),
          ESTADO_AFNITEM_SOL_SER_TEC.RECHAZADA.getCode(),
          ESTADO_AFNITEM_SOL_SER_TEC.ERRADA.getCode(),
        ].indexOf(item.estadoCode) >= 0
      ) {
        throw new Error('Este caso no puede ser asignado.');
      }

      if (item.atendidoPorId) isReasignarCaso = true;
      if (isReasignarCaso) {
        if (canAsignarCasos || item.atendidoPorId === this.auth.id) {
          if (item.atendidoPorId === usuarioIdDecoded) {
            throw new Error('Este caso ya se encuentra asignado a este usuario.');
          }
        } else {
          throw new Error('Usted no puede asignar este caso.');
        }
      } else {
        if (!canAsignarCasos) throw new Error('Usted no puede asignar casos');
      }

      const newNota = new SSTNotaOrm();
      newNota.creadoPorId = this.auth.id;
      newNota.fechaCreacion = new Date();
      newNota.solicitudId = item.solicitudId;
      newNota.itemSolicitudId = item.id;
      newNota.estadoCode = isReasignarCaso
        ? ESTADO_AFNITEM_SOL_SER_TEC.REASIGNADA.getCode()
        : ESTADO_AFNITEM_SOL_SER_TEC.ASIGNADA.getCode();
      newNota.nota = `${RSAServices.decryptId(usuarioId)}${
        ![undefined, null, 'undefined', 'null'].includes(nota) ? 'sltec' + nota : ''
      }`;

      if (![undefined, null, 'undefined', 'null'].includes(nota)) newNota.isNotaPrincipal = true;

      await notaRp.save(newNota);

      if (!includeAllServiciosTecnicos) {
        if (serviciosTecnicosCodes.indexOf(item.tipoServicioTecnicoCode) < 0) {
          throw new Error('Usted no puede asignar este caso porque no pertenece a dicha area');
        }
      }

      if (!usuarioIncludeAllServiciosTecnicos) {
        if (usuarioServiciosTecnicosCodes.indexOf(item.tipoServicioTecnicoCode) < 0) {
          throw new Error(
            'Usted no puede asignar este caso a este usuario porque no pertenece a dicha area'
          );
        }
      }

      item.atendidoPorId = usuarioIdDecoded;
      if (claseServicioTecnicoCode) {
        item.claseServicioTecnicoCode =
          afnClaseSerTecTypeFactory(claseServicioTecnicoCode).getCode();
      }

      if (canAsignarCasos) {
        if (!isReasignarCaso) {
          item.isTipoTarea = isTipoTarea;

          item.tiempoHorasOrDias = tiempo;

          item.formatoTiempo = tipoFormato;

          item.fechaAtencionProgramada = fechaAtencionProgramada;
        } else {
          const nota = item.notas
            .slice()
            .sort(
              (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
            )
            .find(v => v.estadoCode === ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA.getCode());

          if (!nota) {
            if (
              item.tiempoHorasOrDias &&
              item.formatoTiempo &&
              [true, false].includes(item.isTipoTarea)
            ) {
              if (item.tiempoHorasOrDias !== tiempo) item.tiempoHorasOrDias = tiempo;

              if (item.formatoTiempo !== tipoFormato) item.formatoTiempo = tipoFormato;

              item.isTipoTarea = isTipoTarea;
            }
          }
        }
      }

      if (item.fechaAtencionProgramada) {
        const nota = item.notas
          .slice()
          .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime())
          .find(v => v.estadoCode === ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA.getCode());

        if (!nota) {
          const fechaProgramada = new Date(fechaAtencionProgramada);

          const fechaActual = new Date();

          if (fechaActual > fechaProgramada) fechaAtencionProgramada = fechaActual;

          if (item.fechaAtencionProgramada !== fechaAtencionProgramada) {
            item.fechaAtencionProgramada = fechaAtencionProgramada;
          }
        }
      }

      if (!isReasignarCaso) item.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.ASIGNADA.getCode();

      delete item.notas;

      await itemRp.save(item);

      await this.qr.commitTransaction();
      return { result: true, estadoCode: item.estadoCode };
    } catch (error: any) {
      if (isTransactionStarted) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (isTransactionStarted) await this.qr.release();
    }
  }

  public async fetchUsuariosToAsignar(canReasignarCaso = false) {
    const usuSerTecRp = this.conn.getRepository(UsuarioTipoServicioTecnicoOrm);
    const usuarioRp = this.conn.getRepository(UsuarioOrm);

    let misServiciosTecnicos: UsuarioTipoServicioTecnicoOrm[] = [],
      canAsignarCasos = false,
      includeAllServiciosTecnicos = false;

    misServiciosTecnicos = await usuSerTecRp.find({ where: { usuarioId: this.auth.id } });

    const serviciosTecnicosCodes: number[] = [];

    misServiciosTecnicos.forEach(s => {
      if (
        [
          AFNTIPO_SER_REC_TEC__SEEALL.getCode(),
          AFNTIPO_SER_REC_TEC__ATCSNA.getCode(),
          AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode(),
          AFNTIPO_SER_REC_TEC__TODOS__.getCode(),
        ].indexOf(s.tipoServicioTecnicoCode) < 0
      ) {
        serviciosTecnicosCodes.push(s.tipoServicioTecnicoCode);
      }
      if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode()) {
        canAsignarCasos = true;
      }
      if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__TODOS__.getCode()) {
        includeAllServiciosTecnicos = true;
      }
    });

    if (!canAsignarCasos && !canReasignarCaso) throw new Error('Usted no puede asignar casos');

    const usuSerTecs = await usuSerTecRp.find({
      where: {
        tipoServicioTecnicoCode: includeAllServiciosTecnicos
          ? undefined
          : In(serviciosTecnicosCodes),
      },
    });

    const usuarios = await usuarioRp.find({ where: { id: In(usuSerTecs.map(u => u.usuarioId)) } });

    return usuarios.map(u => {
      return {
        id: RSAServices.encryptId(u.id),
        cedula: u.cedula,
        nombreCompleto: u.nombreCompleto,
      };
    });
  }

  public async updateEstado(
    itemId: number,
    nota: string | undefined,
    tipoServicioTecnicoCode: AfnTipoSolSerTecCode | undefined,
    claseSerTecCode: AfnClaseSerTecCode | undefined
  ): Promise<EstadoAfnItemSolSerTecType> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist(TABLE_NAMES.inn.afn.svt.items, itemId);

      transactionStarted = true;

      await this.qr.connect();
      await this.qr.startTransaction();

      const itemSoliRp = this.qr.manager.getRepository(SSTItemOrm);
      const soliRp = this.qr.manager.getRepository(SolicitudServicioTecnicoOrm);
      const notaRp = this.qr.manager.getRepository(SSTNotaOrm);
      const usuarioTipoRp = this.qr.manager.getRepository(UsuarioTipoServicioTecnicoOrm);

      const item = await itemSoliRp.findOne({ where: { id: itemId } });
      const solRecTec = await soliRp.findOne({ where: { id: item.solicitudId } });

      const estadoActual = estadoAfnItemSolSerTecTypeFactory(item.estadoCode);

      if (estadoActual === ESTADO_AFNITEM_SOL_SER_TEC.ERRADA) {
        throw new Error('No se puede continuar con el proceso: el caso está en estado ERRADA.');
      }

      if (
        [ESTADO_AFNITEM_SOL_SER_TEC.ASIGNADA, ESTADO_AFNITEM_SOL_SER_TEC.RECHAZADA].indexOf(
          estadoActual
        ) >= 0
      ) {
        if (this.auth.id !== item.atendidoPorId) {
          throw new Error('Solo puede iniciar el caso el usuario al que le fue asignado');
        }
      }

      if (estadoActual === ESTADO_AFNITEM_SOL_SER_TEC.INICIADA) {
        if (this.auth.id !== item.atendidoPorId) {
          throw new Error('Solo puede finalizar el caso el usuario que lo está gestionando');
        }
      }

      if ([ESTADO_AFNITEM_SOL_SER_TEC.RECHAZADA].indexOf(estadoActual) >= 0) {
        item.atendidoPorId = this.auth.id;
        item.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.INICIADA.getCode();
      } else if (
        [ESTADO_AFNITEM_SOL_SER_TEC.REGISTRADA, ESTADO_AFNITEM_SOL_SER_TEC.ASIGNADA].indexOf(
          estadoActual
        ) >= 0
      ) {
        item.atendidoPorId = this.auth.id;
        item.fechaInicioAtencion = new Date();
        item.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.INICIADA.getCode();

        if (ESTADO_AFNITEM_SOL_SER_TEC.REGISTRADA === estadoActual) {
          const usuarioTipos = await usuarioTipoRp.find({ where: { usuarioId: this.auth.id } });

          const tieneAlgunPermiso = usuarioTipos.some(up =>
            [
              AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode(),
              AFNTIPO_SER_REC_TEC__ATCSNA.getCode(),
            ].includes(up.tipoServicioTecnicoCode)
          );

          if (!tieneAlgunPermiso) {
            throw new Error('Usted no tiene permiso');
          }

          item.tiempoHorasOrDias = 24;
          item.formatoTiempo = 1;
          item.fechaAtencionProgramada = new Date();
          item.isTipoTarea = false;

          if (claseSerTecCode) item.claseServicioTecnicoCode = claseSerTecCode;

          const newNota = new SSTNotaOrm();
          newNota.creadoPorId = this.auth.id;
          newNota.fechaCreacion = new Date();
          newNota.solicitudId = item.solicitudId;
          newNota.itemSolicitudId = item.id;
          newNota.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.ASIGNADA.getCode();
          newNota.nota = `${this.auth.id}${
            ![undefined, null, 'undefined', 'null'].includes(nota) ? 'sltec' + nota : ''
          }`;
          await notaRp.save(newNota);
        }
        /* ---- */
      } else if ([ESTADO_AFNITEM_SOL_SER_TEC.INICIADA].indexOf(estadoActual) >= 0) {
        item.fechaFinalAtencion = new Date();
        item.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA.getCode();
        if (tipoServicioTecnicoCode) {
          item.tipoMantenimientoCode = tipoServicioTecnicoCode;
          await soliRp.save(solRecTec);
        }
      } else {
        throw new Error('No se puede cambiar de estado este item, ya fue finalizado');
      }

      const newNota = new SSTNotaOrm();
      newNota.creadoPorId = this.auth.id;
      newNota.fechaCreacion = new Date();
      newNota.solicitudId = item.solicitudId;
      newNota.itemSolicitudId = item.id;
      newNota.estadoCode = item.estadoCode;
      if (item.estadoCode === ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA.getCode()) {
        newNota.nota = nota;
        newNota.isNotaPrincipal = true;
      }
      await notaRp.save(newNota);

      await itemSoliRp.save(item);

      await this.qr.commitTransaction();
      return estadoAfnItemSolSerTecTypeFactory(item.estadoCode);
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async updateEstadoErrado(itemId: number, nota: string): Promise<boolean> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist(TABLE_NAMES.inn.afn.svt.items, itemId);

      transactionStarted = true;

      await this.qr.connect();
      await this.qr.startTransaction();

      const itemSoliRp = this.qr.manager.getRepository(SSTItemOrm);
      const notaRp = this.qr.manager.getRepository(SSTNotaOrm);
      const usuarioTipoRp = this.qr.manager.getRepository(UsuarioTipoServicioTecnicoOrm);

      const item = await itemSoliRp.findOne({ where: { id: itemId } });

      const estadoActual = estadoAfnItemSolSerTecTypeFactory(item.estadoCode);

      if ([ESTADO_AFNITEM_SOL_SER_TEC.REGISTRADA].indexOf(estadoActual) < 0) {
        throw new Error(
          `Operación no permitida: el caso ya tiene el estado ${estadoActual.getForHumans()}.`
        );
      }

      const usuarioPermisos = await usuarioTipoRp.find({
        where: {
          usuarioId: this.auth.id,
        },
      });

      const tieneAlgunPermiso = usuarioPermisos.some(up =>
        [AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode(), AFNTIPO_SER_REC_TEC__ATCSNA.getCode()].includes(
          up.tipoServicioTecnicoCode
        )
      );

      if (!tieneAlgunPermiso) {
        throw new Error(
          'El usuario no tiene permiso de asignar casos ni de atender casos no asignados.'
        );
      }

      item.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.ERRADA.getCode();

      const newNota = new SSTNotaOrm();
      newNota.creadoPorId = this.auth.id;
      newNota.fechaCreacion = new Date();
      newNota.solicitudId = item.solicitudId;
      newNota.itemSolicitudId = item.id;
      newNota.estadoCode = item.estadoCode;
      newNota.nota = nota;
      newNota.isNotaPrincipal = true;

      await notaRp.save(newNota);

      await itemSoliRp.save(item);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
