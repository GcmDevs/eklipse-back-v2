import { Injectable } from '@nestjs/common';
import {
  SolicitudServicioTecnicoOrm,
  SSTItemOrm,
  SSTNotaOrm,
  UsuarioTipoServicioTecnicoOrm,
} from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { sstNotaOrmToAfnNotaSoliSerTecRes } from '../factories';
import { TABLE_NAMES } from '@common/application/constants';
import { CreateNotaSerTecPayload } from '@inn/lgc/afn/application/payloads';
import { AfnNotaSoliSerTecRes } from '@inn/lgc/afn/application/responses';
import { deleteFile } from '@common/presentation/helpers';
import { ServicioTecnicoBaseSource } from '../bases';
import {
  AFNTIPO_SER_REC_TEC__ASIGNAR__,
  AFNTIPO_SER_REC_TEC__ATCSNA,
  AFNTIPO_SER_REC_TEC__SEEALL,
  AFNTIPO_SER_REC_TEC__TODOS__,
  ESTADO_AFNITEM_SOL_SER_TEC,
  estadoAfnItemSolSerTecTypeFactory,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { IsNull, Not } from 'typeorm';
import { AFN_FILE_LOCATIONS } from '../../application/constants';
import { dataToNuevaEntidadRes, NuevaEntidadRes } from '@common/infrastructure/responses';

@Injectable()
export class NotaServicioTecnicoSource extends ServicioTecnicoBaseSource {
  public async marcarComoVistos(itemSolicitudId: number) {
    await this.verifyEntityExist(TABLE_NAMES.inn.afn.svt.items, itemSolicitudId);

    await this.qr.connect();

    let misServiciosTecnicos: UsuarioTipoServicioTecnicoOrm[] = [];
    let incluyeTodosLosServiciosTecnicos = false;
    let puedeAsignarCasos = false;
    let puedeAtenderCasosNoAsignados = false;
    let puedeVerTodosLosCasos = false;
    try {
      await this.qr.startTransaction();
      const usuSerTecRp = this.qr.manager.getRepository(UsuarioTipoServicioTecnicoOrm);
      const notaSerTecRp = this.qr.manager.getRepository(SSTNotaOrm);
      const itemSerTecRp = this.qr.manager.getRepository(SSTItemOrm);
      const solSerTecRp = this.qr.manager.getRepository(SolicitudServicioTecnicoOrm);

      misServiciosTecnicos = await usuSerTecRp.find({ where: { usuarioId: this.auth.id } });

      misServiciosTecnicos.forEach(s => {
        if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__TODOS__.getCode()) {
          incluyeTodosLosServiciosTecnicos = true;
        }
        if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__ATCSNA.getCode()) {
          puedeAtenderCasosNoAsignados = true;
        }
        if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode()) {
          puedeAsignarCasos = true;
        }
        if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__SEEALL.getCode()) {
          puedeVerTodosLosCasos = true;
        }
      });

      const notas = await notaSerTecRp.find({ where: { itemSolicitudId } });
      const itemSoli = await itemSerTecRp.findOne({ where: { id: itemSolicitudId } });
      const soli = await solSerTecRp.findOne({ where: { id: itemSoli.solicitudId } });

      notas.map(n => {
        if (n.creadoPorId !== this.auth.id) {
          if (!puedeVerTodosLosCasos) {
            n.isVisto = true;
          } else {
            if (soli.creadoPorId === this.auth.id) {
              if (n.creadoPorId !== this.auth.id) n.isVisto = true;
            }
          }
        }
      });

      await notaSerTecRp.save(notas);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async fetch(
    solicitudId: number,
    itemSolicitudId?: number
  ): Promise<AfnNotaSoliSerTecRes[]> {
    try {
      const notaSerTecRp = this.conn.getRepository(SSTNotaOrm);

      const notas = await notaSerTecRp.find({
        where: itemSolicitudId
          ? { solicitudId, itemSolicitudId, isNotaPrincipal: Not(IsNull()) }
          : { solicitudId, isNotaPrincipal: Not(IsNull()) },
        relations: ['creadoPor', 'solicitud'],
      });

      const notasRefactorized = notas.map(n => {
        n = this.refactorizeNotas(n);
        return sstNotaOrmToAfnNotaSoliSerTecRes(n, notas, this.auth.id);
      });

      return notasRefactorized.filter(
        n => n.isNotaPrincipal && n.solicitudCreadoPorId !== this.auth.id
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async create(payload: CreateNotaSerTecPayload): Promise<NuevaEntidadRes> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist(TABLE_NAMES.inn.afn.svt.items, payload.itemSolicitudId);
      if (payload.notaId) {
        await this.verifyEntityExist(TABLE_NAMES.inn.afn.svt.notas, payload.notaId);
      }

      transactionStarted = true;

      await this.qr.connect();
      await this.qr.startTransaction();

      const itemSoliRp = this.qr.manager.getRepository(SSTItemOrm);
      const notaSoliRp = this.qr.manager.getRepository(SSTNotaOrm);

      let notaPrincipal: SSTNotaOrm;

      if (payload.notaId) {
        notaPrincipal = await notaSoliRp.findOne({ where: { id: payload.notaId } });
        if (notaPrincipal.notaRelacionadaId) {
          throw new Error('Ya existe una nota relacionada a esta');
        }
        if ([true, false].indexOf(notaPrincipal.isAprobado) >= 0) {
          throw new Error('No se puede relacionar notas a los cierres de estado');
        }
      }

      const itemSoli = await itemSoliRp.findOne({ where: { id: payload.itemSolicitudId } });

      const estadoActual = estadoAfnItemSolSerTecTypeFactory(itemSoli.estadoCode);

      if (!payload.isEstadoAtencion) {
        if ([ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA].indexOf(estadoActual) >= 0) {
          throw new Error('La solicitud ya fue finalizada');
        }
        if ([ESTADO_AFNITEM_SOL_SER_TEC.APROBADA].indexOf(estadoActual) >= 0) {
          throw new Error('La solución a la solicitud ya fue aprobada por el solicitante');
        }
        if (
          [
            ESTADO_AFNITEM_SOL_SER_TEC.REGISTRADA,
            ESTADO_AFNITEM_SOL_SER_TEC.INICIADA,
            ESTADO_AFNITEM_SOL_SER_TEC.ASIGNADA,
          ].indexOf(estadoActual) < 0
        ) {
          throw new Error('La solicitud no ha sido iniciada');
        }
      } else {
        if ([ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA].indexOf(estadoActual) < 0) {
          throw new Error('El estado de esta solicitud aun no es FINALIZADO');
        }
      }

      if (payload.isEstadoAtencion) {
        if (!payload.isAprobado) {
          itemSoli.fechaFinalAtencion = null;
          itemSoli.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.RECHAZADA.getCode();
        } else {
          itemSoli.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode();
        }
        await itemSoliRp.save(itemSoli);
      }

      const newNota = new SSTNotaOrm();
      if (payload.notaId) newNota.isNotaPrincipal = false;
      else newNota.isNotaPrincipal = true;
      newNota.creadoPorId = this.auth.id;
      newNota.fechaCreacion = new Date();
      newNota.itemSolicitudId = itemSoli.id;
      newNota.solicitudId = itemSoli.solicitudId;
      if (payload.f1FileName) newNota.img1Link = payload.f1FileName;
      if (payload.f2FileName) newNota.img2Link = payload.f2FileName;
      if (payload.isEstadoAtencion) newNota.isAprobado = payload.isAprobado;
      newNota.nota = payload.nota;
      newNota.isVisto = false;

      const notaStored = await notaSoliRp.save(newNota);

      if (payload.notaId) {
        notaPrincipal.notaRelacionadaId = notaStored.id;
        await notaSoliRp.save(notaPrincipal);
      }

      await this.qr.commitTransaction();
      return dataToNuevaEntidadRes(notaStored);
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      if (payload.f1FileName) {
        deleteFile(`${AFN_FILE_LOCATIONS.svt.comprobantesSoluc}/${payload.f1FileName}`);
      }
      if (payload.f2FileName) {
        deleteFile(`${AFN_FILE_LOCATIONS.svt.comprobantesSoluc}/${payload.f2FileName}`);
      }
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
