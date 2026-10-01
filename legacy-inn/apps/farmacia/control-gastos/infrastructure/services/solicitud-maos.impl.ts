import { Injectable } from '@nestjs/common';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { IngresoOrm } from '@orm/gen';
import { Like } from 'typeorm';

@Injectable()
export class SolicitudMaosImpl extends BaseSource {
  public async execute(pattern: string, contextCode: GcmContextCode) {
    const ctx = gcmContextFactory(contextCode);

    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const ingresoRp = qr.manager.getRepository(IngresoOrm);

      const ingreso = await ingresoRp.find({
        where: { consecutivo: Like(`%${pattern}%`) },
        relations: ['paciente'],
        take: 4,
        order: { id: 'DESC' },
      });

      const ingresoResponse = ingreso?.map(item => {
        return {
          id: item.id,
          consecutivo: item.consecutivo,
          fechaIngreso: item.fechaIngreso,
          paciente: {
            id: item.paciente.id,
            nombre: item.paciente.nombreCompleto,
            numDoc: item.paciente.numDoc,
            tipoDoc: item.paciente.documento,
          },
        };
      });
      await qr.commitTransaction();

      return ingresoResponse;
    } catch (error) {
      await qr.rollbackTransaction();

      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
