import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { VerifySopRadI } from '@crn/rad/presentation/dtos';
import { gcmContextFactory } from '@common/domain/types';
import { FacturaOrm } from '@orm/sln';
import { SoporteOrm } from '@orm/crn/rdc';

@Injectable()
export class VerificarSoportesRadicacionImpl extends BaseSource {
  public async execute(payload: VerifySopRadI) {
    let transactionStarted = false;
    const ctx = gcmContextFactory(payload.contextoCode);
    const qr = this.dynamicQR(ctx);
    try {
      await qr.connect();

      const facturaRp = qr.manager.getRepository(FacturaOrm);
      const factura = await facturaRp.findOne({ where: { id: payload.facturaId } });
      if (!factura) throw new Error(`No existe factura con este id en ${ctx.getForHumans()}`);

      const soporteRp = qr.manager.getRepository(SoporteOrm);
      const soporte = await soporteRp.findOne({
        where: { facturaId: payload.facturaId, isRechazado: false },
      });
      if (!soporte) throw new Error('No existe soporte para esta factura con este id');
      else if (soporte.estadoCode === 2) {
        return {
          isNew: false,
          id: factura.id,
          estadoCode: 2,
          observaciones: soporte.observacionVerificacion,
        };
      }

      transactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();

      soporte.contextKey = this.auth.context.getEkKey();
      soporte.fechaUltimoCambioEstado = new Date();
      soporte.estadoCode = payload.isAprobado ? 2 : 3;
      soporte.observacionVerificacion = payload.observaciones;
      soporte.verificadoPorId = this.auth.id;
      soporte.isRechazado = payload.isAprobado ? false : true;

      const sopRadStored = await soporteRp.save(soporte);
      await this.qr.commitTransaction();
      return {
        isNew: true,
        id: factura.id,
        estadoCode: sopRadStored.estadoCode,
        observaciones: sopRadStored.observacionVerificacion,
      };
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
      if (transactionStarted) await this.qr.release();
    }
  }
}
