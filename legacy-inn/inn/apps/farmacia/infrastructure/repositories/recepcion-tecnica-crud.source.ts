import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import {
  ComprobanteEntradaOrm,
  RTCLoteOrm,
  RTCProductoOrm,
  RecepcionTecnicaOrm,
  RemisionEntradaOrm,
  SRDCentroOrm,
} from '../orm';
import { BaseSource, switchConn } from '@common/infrastructure/services';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import { dataToRecepcionTecnica, dataToRecepcionTecnicaProducto } from '../factories';
import { TIPOS_DOCUMENTO } from '@inn/farmacia/domain/types/rec-tec';
import { CreateRTCDto } from '@inn/farmacia/presentation/dtos';

@Injectable()
export class RecepcionTecnicaCrudSource extends BaseSource {
  public async create(payload: CreateRTCDto): Promise<RecepcionTecnicaOrm> {
    const tipoDocumento =
      payload.tipoDocumentoCode === TIPOS_DOCUMENTO.comprobanteEntrada.getCode()
        ? TIPOS_DOCUMENTO.comprobanteEntrada
        : TIPOS_DOCUMENTO.remisionEntrada;

    let qr: QueryRunner, authId: number;

    const ds = switchConn(GCM_CONTEXTS.EKLIPSE);
    const centroRp = ds.getRepository(SRDCentroOrm);
    const centro = await centroRp.findOne({ where: { id: payload.ekCentroId } });
    payload.ekCentroId = centro.originalId;

    qr = this.qr;
    authId = this.auth.id;

    await qr.connect();
    await qr.startTransaction();
    try {
      const recTecRp = qr.manager.getRepository(RecepcionTecnicaOrm);
      const recTecProdRp = qr.manager.getRepository(RTCProductoOrm);
      const recTecLoteRp = qr.manager.getRepository(RTCLoteOrm);

      let documentoId = null;

      if (payload.documentoId) {
        const documentoRp =
          tipoDocumento === TIPOS_DOCUMENTO.comprobanteEntrada
            ? qr.manager.getRepository(ComprobanteEntradaOrm)
            : qr.manager.getRepository(RemisionEntradaOrm);

        const documento = await documentoRp.findOne({
          where: { id: payload.documentoId },
        });

        documentoId = documento.id;
      }

      const rectecFromDoc = await recTecRp.find({
        where: { documentoId, tipoDocumentoCode: tipoDocumento.getCode() },
      });

      if (rectecFromDoc.length) {
        throw new Error(
          `Ya existe una recepción tecnica para este(a) ${tipoDocumento.getForHumans()}`
        );
      }

      const recTec = dataToRecepcionTecnica(payload, authId, documentoId);
      const recTecStored = await recTecRp.save(recTec);

      const recTecProds = payload.detalle.map(producto => {
        if (!producto.lotes) producto.lotes = [];
        return dataToRecepcionTecnicaProducto(producto, recTecStored);
      });

      const recTecProdStored: RTCProductoOrm[] = [];

      let counter = 0;
      let recTecProdsWillBeSaved: RTCProductoOrm[] = [];

      const recTecProdsLength = recTecProds.length;

      for (let index = 0; index < recTecProdsLength; index++) {
        counter++;
        const element = recTecProds[index];
        recTecProdsWillBeSaved.push(element);
        if (counter === 20 || index === recTecProdsLength - 1) {
          const tempRecTecProdStored = await recTecProdRp.save(recTecProdsWillBeSaved);
          recTecProdStored.push(...tempRecTecProdStored);
          counter = 0;
          recTecProdsWillBeSaved = [];
        }
      }

      const lotes: RTCLoteOrm[] = [];

      recTecProdStored.map(pr => {
        pr.recepcionTecnica = recTecStored;
        pr.tempLotes.map(tl => {
          tl.RTCProductoId = pr.id;
          lotes.push(tl);
        });

        pr.lotes = pr.tempLotes;

        delete pr.recepcionTecnica;
      });

      if (lotes.length) await recTecLoteRp.save(lotes);

      recTecStored.detalle = recTecProdStored;

      await qr.commitTransaction();

      const data: any = {};

      data.id = recTecStored.id;
      data.detalle = recTecStored.detalle.map(dt => {
        return {
          id: dt.id,
          itemDetalleId: dt.itemDetalleId,
          lotes: dt.tempLotes.map(tlt => {
            return {
              id: tlt.id,
              lote: tlt.lote,
            };
          }),
        };
      });

      return data;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async update(payload: CreateRTCDto): Promise<RecepcionTecnicaOrm> {
    let qr: QueryRunner, authId: number;
    if (this.auth.context === GCM_CONTEXTS.AMMEDICAL) {
      const ds = switchConn(GCM_CONTEXTS.EKLIPSE);

      const centroRp = ds.getRepository(SRDCentroOrm);
      const centro = await centroRp.findOne({ where: { id: payload.ekCentroId } });

      payload.ekCentroId = centro.originalId;

      qr = switchConn(gcmContextFactory(centro.contextCode)).createQueryRunner();
    } else {
      qr = this.qr;
      authId = this.auth.id;
    }

    await qr.connect();
    await qr.startTransaction();
    try {
      const recTecRp = qr.manager.getRepository(RecepcionTecnicaOrm);

      const recepcionTecnica = await recTecRp.findOne({ where: { id: payload.id } });

      if (authId !== recepcionTecnica.usuarioId) {
        throw new Error(`Esta recepción solo puede ser modificada por el que la registró`);
      }

      const recTecProdRp = qr.manager.getRepository(RTCProductoOrm);
      const recTecLoteRp = qr.manager.getRepository(RTCLoteOrm);

      const diffInSeconds =
        (new Date().getTime() - new Date(recepcionTecnica.createdAt).getTime()) / 1000;

      if (diffInSeconds > 10800) {
        throw new Error(
          'Han pasado mas de 3 horas desde la creación del item, no se puede modificar'
        );
      } else {
        let recTec: RecepcionTecnicaOrm;

        if (recepcionTecnica.id === payload.id) {
          recTec = dataToRecepcionTecnica(payload, authId);
        } else {
          throw new Error('No existe recepción tecnica con este id');
        }

        const productos = await recTecProdRp.find({
          where: { recepcionTecnicaId: payload.id },
          relations: ['lotes'],
        });

        const recTecStored = await recTecRp.save(recTec);

        const productosActualizados: RTCProductoOrm[] = payload.detalle.map(dt =>
          dataToRecepcionTecnicaProducto(dt, recTecStored)
        );

        const idsProductosFromFront = payload.detalle.map(el => {
          if (el.id) return el.id;
        });

        productos.map(pro => {
          if (idsProductosFromFront.indexOf(pro.id) < 0) {
            pro.isDeleted = true;
            productosActualizados.push(pro);
          }
        });

        const recTecProdStored = await recTecProdRp.save(productosActualizados);

        const lotes: RTCLoteOrm[] = [];

        recTecProdStored.map(el => {
          if (el.tempLotes) {
            el.tempLotes.map(tl => {
              tl.RTCProductoId = el.id;
              lotes.push(tl);
            });

            el.lotes = el.tempLotes;
          }

          delete el.recepcionTecnica;
        });

        if (lotes.length) await recTecLoteRp.save(lotes);

        recTecStored.detalle = recTecProdStored;

        await qr.commitTransaction();

        return recTecStored;
      }
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
