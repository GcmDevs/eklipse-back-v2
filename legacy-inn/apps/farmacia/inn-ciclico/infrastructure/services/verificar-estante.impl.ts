import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { TABLE_NAMES } from '@common/application/constants';
import { VerificacionOrm } from '@orm/inn/productos/estantes';
import { VerificarEstantePayload } from '@farmacia/inn-ciclico/application/payloads';

@Injectable()
export class VerificarEstanteImpl extends BaseSource {
  async execute(estanteId: number, body: VerificarEstantePayload) {
    await this.verifyEntityExist(TABLE_NAMES.inn.pdt.stt.estantes, estanteId);
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const verificacionRp = this.qr.manager.getRepository(VerificacionOrm);

      const lastVerificacion = await verificacionRp.findOne({
        where: { estanteId },
        order: { id: 'desc' },
      });

      if (!lastVerificacion) throw new Error('No hay conteo pendiente por verificar');
      if (lastVerificacion.fechaVerificacion) throw new Error('Ya fue verificado');

      lastVerificacion.verificadoPorId = this.auth.user.id;
      lastVerificacion.fechaVerificacion = new Date();
      lastVerificacion.observaciones = body.observaciones;

      await verificacionRp.save(lastVerificacion);
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
