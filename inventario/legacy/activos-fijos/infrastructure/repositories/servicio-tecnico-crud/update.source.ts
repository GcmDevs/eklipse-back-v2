import { Injectable } from '@nestjs/common';
import {
  SolicitudServicioTecnicoOrm,
  SSTItemOrm,
} from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { CreateSoliSerTecPayload } from '@inn/lgc/afn/application/payloads';
import { ServicioTecnicoBaseSource } from '../../bases';
import {
  afnTipoSerTecTypeFactory,
  afnTipoSolSerTecTypeFactory,
  ESTADO_AFNITEM_SOL_SER_TEC,
  estadoAfnItemSolSerTecTypeFactory,
  tipoRequerimientoContratoSolSerTecTypeFactory,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { deleteFile } from '@common/presentation/helpers';
import { TABLE_NAMES } from '@common/application/constants';
import { prioridadTypeFactory } from '@inn/lgc/afn/types/gen';
import { In, Not } from 'typeorm';
import { afnSoliSerTecOrmToCreateAfnSoliSerTecResFactory } from '@inn/lgc/afn/infrastructure/factories';
import { CreateAfnSoliSerTecRes } from '@inn/lgc/afn/application/responses';
import { AFN_FILE_LOCATIONS } from '@inn/lgc/afn/application/constants';

@Injectable()
export class UpdateSolicitudServicioTecnicoSource extends ServicioTecnicoBaseSource {
  public async execute(
    solicitudId: number,
    payload: CreateSoliSerTecPayload
  ): Promise<CreateAfnSoliSerTecRes> {
    let transactionStarted = false;

    try {
      await this.verifyEntityExist(TABLE_NAMES.adn.centros, payload.centroId);

      await this.verifyEntityExist(TABLE_NAMES.gen.dependencias, payload.dependenciaId);

      for (let index = 0; index < payload.detalle.length; index++) {
        const el = payload.detalle[index];
        if (el.activoId) await this.verifyEntityExist(TABLE_NAMES.inn.afn.activos, el.activoId);
        if (el.ingresoId) await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, el.ingresoId);
      }

      transactionStarted = true;

      await this.qr.connect();
      await this.qr.startTransaction();

      const soliRp = this.qr.manager.getRepository(SolicitudServicioTecnicoOrm);

      const itemRp = this.qr.manager.getRepository(SSTItemOrm);

      const solicitud = await soliRp.findOne({
        where: { id: solicitudId },
        relations: ['detalle'],
      });

      if (!solicitud) {
        throw new Error(`La solicitud con ID ${solicitudId} no existe`);
      }

      if (solicitud.creadoPorId !== this.auth.id) {
        throw new Error(`Usted no puede actualizar esta solicitud`);
      }

      solicitud.prioridadCode = prioridadTypeFactory(payload.prioridadCode).getCode();
      solicitud.centroId = payload.centroId;
      solicitud.dependenciaId = payload.dependenciaId;
      solicitud.ubicacion = payload.ubicacion;
      solicitud.fechaCreacion = new Date();
      const newSolicitud = await soliRp.save(solicitud);

      const item = await itemRp.findOne({
        where: { solicitudId },
      });

      if (
        !(
          [
            ESTADO_AFNITEM_SOL_SER_TEC.REGISTRADA.getCode(),
            ESTADO_AFNITEM_SOL_SER_TEC.ERRADA.getCode(),
          ].indexOf(item.estadoCode) >= 0
        )
      ) {
        throw new Error(
          `Solo se permite si el estado es REGISTRADA o ERRADA; estado actual: ${estadoAfnItemSolSerTecTypeFactory(
            item.estadoCode
          ).getForHumans()}.`
        );
      }

      for (let index = 0; index < payload.detalle.length; index++) {
        const el = payload.detalle[index];

        if (el.activoId) {
          if (item.activoId !== el.activoId) {
            const itemsSoli = await itemRp.find({
              where: {
                activoId: el.activoId,
                estadoCode: Not(In([ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode()])),
              },
            });

            if (itemsSoli.length >= 1) {
              throw new Error(`Uno o mas activos tiene una solicitud pendiente`);
            }
          }
        }
        if (el.ingresoId) {
          if (item.ingresoId !== el.ingresoId) {
            const itemsSoli = await itemRp.find({
              where: {
                ingresoId: el.ingresoId,
                estadoCode: Not(In([ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode()])),
              },
            });

            if (itemsSoli.length >= 1) {
              throw new Error(`Uno o mas pacientes tiene una solicitud pendiente`);
            }
          }
        }
      }

      payload.detalle.forEach(d => {
        item.activoId = d.activoId;
        item.ingresoId = d.ingresoId;
        item.observacion = d.observacion;
        item.isFallaInUsoClinico = d.isFallaInUsoClinico;
        item.isPacienteLesionadoByEquipo = d.isPacienteLesionadoByEquipo;
        item.fechaLimReq = d.fechaLimReq;
        item.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.REGISTRADA.getCode();
        item.tipoServicioTecnicoCode = afnTipoSerTecTypeFactory(
          d.tipoServicioTecnicoCode
        ).getCode();
        item.tipoMantenimientoCode = afnTipoSolSerTecTypeFactory(d.tipoMantenimientoCode).getCode();

        if (d.tipoRequerimientoContratoCode) {
          item.requerimientoCode = tipoRequerimientoContratoSolSerTecTypeFactory(
            d.tipoRequerimientoContratoCode
          ).getCode();
        } else {
          item.requerimientoCode = null;
        }

        if (payload.f1FileName) {
          item.img1Link = payload.f1FileName;
        }
        if (payload.f2FileName) {
          item.img2Link = payload.f2FileName;
        }
      });

      const newItem = await itemRp.save(item);

      solicitud.detalle = [newItem];

      await this.qr.commitTransaction();

      return afnSoliSerTecOrmToCreateAfnSoliSerTecResFactory(newSolicitud);
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      if (payload.f1FileName) {
        deleteFile(`${AFN_FILE_LOCATIONS.svt.comprobantesFallo}/${payload.f1FileName}`);
      }
      if (payload.f2FileName) {
        deleteFile(`${AFN_FILE_LOCATIONS.svt.comprobantesFallo}/${payload.f2FileName}`);
      }
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
