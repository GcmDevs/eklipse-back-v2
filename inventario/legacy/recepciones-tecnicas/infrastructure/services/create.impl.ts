import { BadRequestException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import { dataToRecepcionTecnicaOrm, dataToRecepcionTecnicaProducto } from '../factories';
import { TIPOS_DOCUMENTO } from '@inn/lgc/rct/types/inn/documentos';
import { CreateRTCDto } from '@inn/lgc/rct/presentation/dtos';
import {
  RecepcionTecnicaOrm,
  RTCLoteOrm,
  DetalleRecepcionTecnicaOrm,
} from '@inn/lgc/rct/orm/inn/farmacia/recepcion-tecnica';
import { ComprobanteEntradaOrm, RemisionEntradaOrm } from '@inn/lgc/rct/orm/inn/documentos';
import { prepararInspecciones } from './inspeccion';

@Injectable()
export class CreateRecepcionTecnicaImpl extends BaseSource {
  public async execute(payload: CreateRTCDto): Promise<RecepcionTecnicaOrm> {
    const tipoDocumento =
      payload.tipoDocumentoCode === TIPOS_DOCUMENTO.COMPROBANTE_ENTRADA.getCode()
        ? TIPOS_DOCUMENTO.COMPROBANTE_ENTRADA
        : TIPOS_DOCUMENTO.REMISION_ENTRADA;

    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const recTecRp = this.qr.manager.getRepository(RecepcionTecnicaOrm);
      const recTecProdRp = this.qr.manager.getRepository(DetalleRecepcionTecnicaOrm);
      const recTecLoteRp = this.qr.manager.getRepository(RTCLoteOrm);

      let documentoId = null;

      if (payload.documentoId) {
        const documentoRp =
          tipoDocumento === TIPOS_DOCUMENTO.COMPROBANTE_ENTRADA
            ? this.qr.manager.getRepository(ComprobanteEntradaOrm)
            : this.qr.manager.getRepository(RemisionEntradaOrm);

        const documento = await documentoRp.findOne({
          where: { id: payload.documentoId },
        });

        if (!documento) throw new Error('No existe el documento en el contexto actual.');
        documentoId = documento.id;
      }

      let recTecStored: RecepcionTecnicaOrm;

      recTecStored = await recTecRp.findOne({
        where: {
          documentoId,
          tipoDocumentoCode:
            tipoDocumento === TIPOS_DOCUMENTO.REMISION_ENTRADA ? 3 : tipoDocumento.getCode(),
        },
      });

      if (!recTecStored) {
        if (payload.id)
          throw new Error('No se puede reutilizar el identificador de otra recepción.');
        const recTec = dataToRecepcionTecnicaOrm(payload, this.auth.id, documentoId);
        recTecStored = await recTecRp.save(recTec);
      } else {
        if (payload.id && payload.id !== recTecStored.id)
          throw new Error('El identificador no corresponde al documento.');
        if (Date.now() - new Date(recTecStored.createdAt).getTime() > 7 * 86400000)
          throw new Error('Esta recepción técnica está cerrada para edición.');
        const cond1 = recTecStored.centroId !== payload.centroId;
        const cond2 = recTecStored.transportadoraId !== payload.transportadoraId;
        if (cond1) recTecStored.centroId = payload.centroId;
        if (cond2) recTecStored.transportadoraId = payload.transportadoraId;
        if (cond1 || cond2) recTecStored = await recTecRp.save(recTecStored);
      }

      await prepararInspecciones(this.qr.manager, payload, recTecStored, this.auth.id);
      const recTecProds = payload.detalle.map(item => {
        if (!item.lotes) item.lotes = [];
        return dataToRecepcionTecnicaProducto(item, recTecStored);
      });

      const recTecProdStored: DetalleRecepcionTecnicaOrm[] = [];

      let counter = 0;
      let recTecProdsWillBeSaved: DetalleRecepcionTecnicaOrm[] = [];

      const recTecProdsLength = recTecProds.length;

      for (let index = 0; index < recTecProdsLength; index++) {
        counter++;
        const el = recTecProds[index];

        const recTecProd = await recTecProdRp.findOne({
          where: {
            recepcionTecnicaId: el.recepcionTecnicaId,
            itemDetalleId: el.itemDetalleId,
            productoId: el.productoId,
          },
        });

        if (recTecProd) el.id = recTecProd.id;

        recTecProdsWillBeSaved.push(el);
        if (counter === 20 || index === recTecProdsLength - 1) {
          const tempRecTecProdStored = await recTecProdRp.save(recTecProdsWillBeSaved);
          recTecProdStored.push(...tempRecTecProdStored);
          counter = 0;
          recTecProdsWillBeSaved = [];
        }
      }

      const lotesPrevios = await recTecLoteRp.find({
        where: { RTCProductoId: In(recTecProdStored.map(rt => rt.id)) },
      });

      await recTecLoteRp.remove(lotesPrevios);

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

      await this.qr.commitTransaction();

      const data: any = {};

      data.id = recTecStored.id;
      data.detalle = recTecStored.detalle.map(dt => {
        return {
          id: dt.id,
          itemDetalleId: dt.itemDetalleId,
          inspeccion: dt.inspeccionJson ? JSON.parse(dt.inspeccionJson) : undefined,
          cumpleRecepcionTecnica: dt.cumpleRecepcionTecnica,
          lotes: dt.tempLotes.map(tlt => {
            return {
              id: tlt.id,
              lote: tlt.lote,
            };
          }),
        };
      });

      return data;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
