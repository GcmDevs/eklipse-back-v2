import { RecepcionTecnicaOrm } from '@inn/lgc/rct/orm/inn/farmacia/recepcion-tecnica';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class UnrequiredRecepcionTecnicaImpl extends BaseSource {
  public async execute(documentoId: number): Promise<boolean> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const recTecRp = this.qr.manager.getRepository(RecepcionTecnicaOrm);

      const newRecTec = new RecepcionTecnicaOrm();
      newRecTec.usuarioId = this.auth.id;
      newRecTec.createdAt = new Date();
      newRecTec.noRequiereRecepTec = true;
      newRecTec.documentoId = documentoId;

      await recTecRp.save(newRecTec);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
