import { BadRequestException, Injectable } from '@nestjs/common';
import { VerificarEstanteDto } from '@inn/ciclico/application/dtos';
import { BaseSource } from '@common/infrastructure/services';
import { VerificacionEstanteOrm } from '@inn/orm/inn';
import { TABLE_NAMES } from '@inn/orm/table-names';

@Injectable()
export class VerificarEstanteImpl extends BaseSource {
  async execute(estanteId: number, body: VerificarEstanteDto) {
    await this.verifyEntityExist(TABLE_NAMES.inn.estantes, estanteId);
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const newEntity = new VerificacionEstanteOrm();
      newEntity.observaciones = body.observaciones;
      newEntity.usuarioId = this.auth.user.id;
      newEntity.estanteId = estanteId;
      newEntity.createdAt = new Date();

      const verificacionRp = this.qr.manager.getRepository(VerificacionEstanteOrm);
      await verificacionRp.save(newEntity);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
