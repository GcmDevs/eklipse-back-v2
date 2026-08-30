import { Injectable } from '@nestjs/common';
import { CreateAfnSoliSerTecRes } from '@inn/lgc/afn/application/responses';
import {
  SSTItemOrm,
  SolicitudServicioTecnicoOrm,
} from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import {
  afnSoliSerTecOrmToCreateAfnSoliSerTecResFactory,
  createSoliServTecnPayloadToAfnSoliSerTecOrmFactory,
  itemSoliServTecnPayloadToAfnItemSoliSerTecOrmFactory,
} from '../../factories';
import { TABLE_NAMES } from '@common/application/constants';
import { CreateSoliSerTecPayload } from '@inn/lgc/afn/application/payloads';
import { ESTADO_AFNITEM_SOL_SER_TEC } from '@inn/lgc/afn/types/inn/activos-fijos';
import { deleteFile } from '@common/presentation/helpers';
import { ServicioTecnicoBaseSource } from '../../bases';
import { In, Not } from 'typeorm';
import { AFN_FILE_LOCATIONS } from '@inn/lgc/afn/application/constants';

@Injectable()
export class CreateSolicitudServicioTecnicoSource extends ServicioTecnicoBaseSource {
  public async execute(payload: CreateSoliSerTecPayload): Promise<CreateAfnSoliSerTecRes> {
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
      const itemSoliRp = this.qr.manager.getRepository(SSTItemOrm);

      for (let index = 0; index < payload.detalle.length; index++) {
        const el = payload.detalle[index];

        if (el.activoId) {
          const itemsSoli = await itemSoliRp.find({
            where: {
              activoId: el.activoId,
              estadoCode: Not(In([ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode()])),
            },
          });

          if (itemsSoli.length >= 1) {
            throw new Error(`Uno o mas activos tiene una solicitud pendiente`);
          }
        }
        if (el.ingresoId) {
          const itemsSoli = await itemSoliRp.find({
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

      const newSoli = createSoliServTecnPayloadToAfnSoliSerTecOrmFactory(payload, this.auth.id);
      const soliStored = await soliRp.save(newSoli);

      const newDets: SSTItemOrm[] = [];

      payload.detalle.forEach(d => {
        const newDet = itemSoliServTecnPayloadToAfnItemSoliSerTecOrmFactory(d, soliStored);
        newDet.img1Link = payload.f1FileName;
        newDet.img2Link = payload.f2FileName;
        newDets.push(newDet);
      });

      const detsStored = await itemSoliRp.save(newDets);

      soliStored.detalle = detsStored;

      await this.qr.commitTransaction();
      return afnSoliSerTecOrmToCreateAfnSoliSerTecResFactory(soliStored);
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
