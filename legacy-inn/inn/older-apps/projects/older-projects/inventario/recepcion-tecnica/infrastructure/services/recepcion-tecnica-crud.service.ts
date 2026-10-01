import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  RecepcionTecnicaOrm,
  RecTecProductoOrm,
} from '@inn/old/orm/gcm/inventario/recepcion-tecnica';
import { dataToRecepcionTecnica, dataToRecepcionTecnicaProducto } from '../factories';
import { CreateRecepcionTecnicaRequest } from '@inn/rft/inventario/recepcion-tecnica/presentation/requests';

@Injectable()
export class RecepcionTecnicaCrudService extends BaseSource {
  public async fetch(): Promise<RecepcionTecnicaOrm[]> {
    try {
      const repo = this.conn.getRepository(RecepcionTecnicaOrm);
      const recTecs = await repo.find({
        relations: [
          'laboratorioIJ',
          'transportadoraIJ',
          'productos',
          'usuario',
          'productos.producto',
          'productos.unidadMedidaIJ',
          'productos.presentacionIJ',
          'productos.formaFarmaceuticaIJ',
          'productos.laboratorioIJ',
        ],
      });

      recTecs.map(el => {
        const diffInSeconds = (new Date().getTime() - new Date(el.createdAt).getTime()) / 1000;

        if (diffInSeconds > 86400) el.canBeUpdated = false;
        else el.canBeUpdated = true;
      });

      return recTecs;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async create(payload: CreateRecepcionTecnicaRequest): Promise<RecepcionTecnicaOrm> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const recTecRp = this.qr.manager.getRepository(RecepcionTecnicaOrm);
      const recTecProdRp = this.qr.manager.getRepository(RecTecProductoOrm);

      const recTec = dataToRecepcionTecnica(payload, this.auth.id);
      const recTecStored = await recTecRp.save(recTec);

      const recTecProds = payload.productos.map(producto =>
        dataToRecepcionTecnicaProducto(producto, recTecStored)
      );

      const recTecProdStored = await recTecProdRp.save(recTecProds);

      recTecProdStored.map(_ => {
        delete _.recepcionTecnica;
      });

      recTecStored.productos = recTecProdStored;

      await this.qr.commitTransaction();

      return recTecStored;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async update(payload: CreateRecepcionTecnicaRequest): Promise<RecepcionTecnicaOrm> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const recTecRp = this.qr.manager.getRepository(RecepcionTecnicaOrm);
      const recTecProdRp = this.qr.manager.getRepository(RecTecProductoOrm);

      const recepcionTecnica = await recTecRp.findOne({ where: { id: payload.id } });

      const diffInSeconds =
        (new Date().getTime() - new Date(recepcionTecnica.createdAt).getTime()) / 1000;

      if (diffInSeconds < 86400) {
        throw new Error(
          'Han pasado mas de 24 horas desde la creación del item, no se puede modificar'
        );
      } else {
        let recTec: RecepcionTecnicaOrm;

        if (recepcionTecnica.id === payload.id) {
          recTec = dataToRecepcionTecnica(payload, this.auth.id);
        } else {
          throw new Error('No existe recepción tecnica con este id');
        }

        const productos = await recTecProdRp.find({ where: { recepcionTecnicaId: payload.id } });

        const recTecStored = await recTecRp.save(recTec);

        const recTecProds = payload.productos.map(producto => {
          if (productos.filter(el => el.id === producto.id).length) {
            return dataToRecepcionTecnicaProducto(producto, recTecStored);
          } else {
            throw new Error('Uno o mas productos no pertenecen a la recepción tecnica');
          }
        });

        const recTecProdStored = await recTecProdRp.save(recTecProds);

        recTecProdStored.map(_ => {
          delete _.recepcionTecnica;
        });

        recTecStored.productos = recTecProdStored;

        await this.qr.commitTransaction();

        return recTecStored;
      }
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
