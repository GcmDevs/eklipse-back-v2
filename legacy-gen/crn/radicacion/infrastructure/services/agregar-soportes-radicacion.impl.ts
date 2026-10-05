import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { deleteFile } from '@common/presentation/helpers';
import { AddSopRadI } from '@crn/rad/presentation/dtos';
import { ENVIRONMENTS } from 'src/app.environments';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { SoporteOrm } from '@orm/crn/rdc';
import { FacturaOrm } from '@orm/sln';

@Injectable()
export class AgregarSoportesRadicacionImpl extends BaseSource {
  public async execute(payload: AddSopRadI) {
    let transactionStarted = false;
    try {
      const facturaRp = this.conn.getRepository(FacturaOrm);
      const factura = await facturaRp.findOne({ where: { id: payload.facturaId } });
      if (!factura) throw new Error('No existe factura con este id');
      const soporteRp = this.conn.getRepository(SoporteOrm);
      const soporte = await soporteRp.findOne({
        where: { facturaId: payload.facturaId, isRechazado: false },
      });
      if (soporte) {
        if (payload.facturaFileName) {
          deleteFile(`${FILE_LOCATIONS.crn.rdc.comprobantes}/${payload.facturaFileName}`);
        }
        if (payload.comprobanteFileName) {
          deleteFile(`${FILE_LOCATIONS.crn.rdc.comprobantes}/${payload.comprobanteFileName}`);
        }

        return {
          isNew: false,
          id: factura.id,
          facturaDoc: `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.rdc.comprobantes}/${soporte.facturaDocumento}`,
          comprobanteDoc: `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.rdc.comprobantes}/${soporte.comprobanteDocumento}`,
        };
      }

      transactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();

      const soporteRadicacion = this.qr.manager.getRepository(SoporteOrm);

      const newSopRad = new SoporteOrm();
      newSopRad.facturaId = payload.facturaId;
      newSopRad.facturaDocumento = payload.facturaFileName;
      newSopRad.comprobanteDocumento = payload.comprobanteFileName;
      newSopRad.creadoPorId = this.auth.id;
      newSopRad.fechaCreacion = new Date();
      newSopRad.estadoCode = 1;
      newSopRad.isRechazado = false;

      const sopRadStored = await soporteRadicacion.save(newSopRad);
      await this.qr.commitTransaction();
      return {
        isNew: true,
        id: sopRadStored.id,
        facturaDoc: `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.rdc.comprobantes}/${sopRadStored.facturaDocumento}`,
        comprobanteDoc: `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.rdc.comprobantes}/${sopRadStored.comprobanteDocumento}`,
      };
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      if (payload.facturaFileName) {
        deleteFile(`${FILE_LOCATIONS.crn.rdc.comprobantes}/${payload.facturaFileName}`);
      }
      if (payload.comprobanteFileName) {
        deleteFile(`${FILE_LOCATIONS.crn.rdc.comprobantes}/${payload.comprobanteFileName}`);
      }
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
