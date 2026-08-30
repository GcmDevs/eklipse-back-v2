import { BadRequestException, Injectable } from '@nestjs/common';
import { dataToRecepcionTecnicaOrm, dataToRecepcionTecnicaProducto } from '../factories';
import { CreateRTCDto } from '@inn/lgc/rct/presentation/dtos';
import { BaseSource } from '@common/infrastructure/services';
import {
  RecepcionTecnicaOrm,
  RTCLoteOrm,
  DetalleRecepcionTecnicaOrm,
} from '@inn/lgc/rct/orm/inn/farmacia/recepcion-tecnica';

@Injectable()
export class UpdateRecepcionTecnicaImpl extends BaseSource {
  public async execute(payload: CreateRTCDto): Promise<RecepcionTecnicaOrm> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const recTecRp = this.qr.manager.getRepository(RecepcionTecnicaOrm);
      const recepcionTecnica = await recTecRp.findOne({ where: { id: payload.id } });

      if (this.auth.id !== recepcionTecnica.usuarioId) {
        throw new Error(`Esta recepción solo puede ser modificada por el que la registró`);
      }

      const recTecProdRp = this.qr.manager.getRepository(DetalleRecepcionTecnicaOrm);
      const recTecLoteRp = this.qr.manager.getRepository(RTCLoteOrm);

      const diffInSeconds =
        (new Date().getTime() - new Date(recepcionTecnica.createdAt).getTime()) / 1000;

      if (diffInSeconds > 10800) {
        throw new Error(
          'Han pasado mas de 3 horas desde la creación del item, no se puede modificar'
        );
      } else {
        let recTec: RecepcionTecnicaOrm;

        if (recepcionTecnica.id === payload.id) {
          recTec = dataToRecepcionTecnicaOrm(payload, this.auth.id);
        } else {
          throw new Error('No existe recepción tecnica con este id');
        }

        const productos = await recTecProdRp.find({
          where: { recepcionTecnicaId: payload.id },
          relations: ['lotes'],
        });

        const recTecStored = await recTecRp.save(recTec);

        const productosActualizados: DetalleRecepcionTecnicaOrm[] = payload.detalle.map(dt =>
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

        await this.qr.commitTransaction();

        return recTecStored;
      }
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
