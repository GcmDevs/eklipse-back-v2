import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { AccesorioOrm, MantenimientoOrm } from '../orm';
import { DocumentoOrm } from '../orm/documento.orm';
import { MantenimientoDto } from '../../presentation/dtos';
import { In } from 'typeorm';
import { MtoAccesorioOrm } from '../orm/mto-accesorio.orm';

@Injectable()
export class MantenimientoCrudSource extends BaseSource {
  public async fetchByDocumentoId(documentoId: number) {
    const mantenimientoRp = this.conn.getRepository(MantenimientoOrm);

    const result = await mantenimientoRp.find({
      where: { documentoId },
      relations: ['usuario', 'accesorios'],
    });

    return result;
  }

  public async create(body: MantenimientoDto) {
    let authId: number;
    authId = this.auth.id;

    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const mantenimientoRp = this.qr.manager.getRepository(MantenimientoOrm);

      const documentoRp = this.qr.manager.getRepository(DocumentoOrm);

      const documento = await documentoRp.findOne({ where: { id: body.documentoId } });

      if (!documento) {
        throw new Error(`No se encontro documento asociado a este id ${body.documentoId}`);
      }

      let newMto = new MantenimientoOrm();

      newMto.documentoId = body.documentoId;
      newMto.usuarioId = authId;
      newMto.fechaCreacion = new Date();
      newMto.fechaNewMto = new Date(body.fechaNewMto);
      newMto.tipoMantenimientoCode = body.tipoCode;
      newMto.numeroReporte = body.numeroReporte;
      newMto.valor = body.valor;
      newMto.observacion = body.observacion;

      const mtoLocal = await mantenimientoRp.save(newMto);

      const mtoAccesorioRp = this.qr.manager.getRepository(MtoAccesorioOrm);

      const accesorioRp = this.qr.manager.getRepository(AccesorioOrm);

      if (body.accesorioIds) {
        const accesorios = await accesorioRp.find({
          where: { id: In(body.accesorioIds) },
        });

        const accesoriosIdSet = new Set(accesorios.map(acc => acc.id));

        const allAccesoriosExist = body.accesorioIds.every(id => accesoriosIdSet.has(id));

        if (!allAccesoriosExist) {
          throw new Error(
            'Uno o más accesorios seleccionados no se encuentran registrados en la base de datos.'
          );
        }
        const accesoriosToSave = accesorios.filter(acc => body.accesorioIds.includes(acc.id));

        const accesorionExistentes = accesoriosToSave.map(async acc => {
          const mtoAccesorio = new MtoAccesorioOrm();
          mtoAccesorio.accesorioId = acc.id;
          mtoAccesorio.mantenimientoId = mtoLocal.id;
          return mtoAccesorioRp.save(mtoAccesorio);
        });

        await Promise.all(accesorionExistentes);
      }

      if (body.accesorios) {
        const savedAccesorios = [];

        for (const value of body.accesorios) {
          if (value) {
            let newAccesorio = new AccesorioOrm();
            newAccesorio.nombre = value.nombre;
            const savedAccesorio = await accesorioRp.save(newAccesorio);
            savedAccesorios.push(savedAccesorio);
          }
        }
        const saveNewMtoAccesorio = savedAccesorios.map(async newAccesorio => {
          const mtoAccesorio = new MtoAccesorioOrm();
          mtoAccesorio.accesorioId = newAccesorio.id;
          mtoAccesorio.mantenimientoId = mtoLocal.id;
          return mtoAccesorioRp.save(mtoAccesorio);
        });

        await Promise.all(saveNewMtoAccesorio);
      }

      await this.qr.commitTransaction();

      return mtoLocal.id;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
