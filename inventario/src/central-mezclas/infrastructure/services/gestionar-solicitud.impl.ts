import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { SolicitudOrm } from '@inn/orm/inn/central-mezclas';
import { CtMzGestionSolicitudPayload } from '@inn/central-mezclas/presentation/dtos';
import { ESTADOS } from '@inn/types/inn/central-mezclas';

@Injectable()
export class GestionarSolicitudImpl extends BaseSource {
  public async execute(
    solicitudId: number,
    payload: CtMzGestionSolicitudPayload
  ): Promise<boolean> {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const solicitudRp = this.qr.manager.getRepository(SolicitudOrm);
      const solicitud = await solicitudRp.findOne({ where: { id: solicitudId } });

      if (!solicitud) throw new Error('La solicitud no existe');
      if (payload.estadoCode !== ESTADOS.ACEPTADA.getCode() && !payload.observacion) {
        throw new Error('La observacion es requerida para gestionar la solicitud');
      }

      solicitud.estadoCode = payload.estadoCode;
      solicitud.observacionGestion = payload.observacion ?? '';
      solicitud.usuarioResponsableId = this.auth.id;
      solicitud.fechaGestion = new Date();

      await solicitudRp.save(solicitud);
      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (this.qr.isTransactionActive) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (!this.qr.isReleased) await this.qr.release();
    }
  }
}
