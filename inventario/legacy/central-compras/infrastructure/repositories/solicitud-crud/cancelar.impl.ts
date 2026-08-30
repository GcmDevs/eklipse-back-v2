import { BadRequestException, Injectable } from '@nestjs/common';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CancelarSolicitudDto } from '@inn/lgc/ctc/presentation/dtos';
import { gcmContextFactory } from '@common/domain/types';
import { SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { CentralComprasSource } from '../../base';

@Injectable()
export class CancelarSolicitudImpl extends CentralComprasSource {
  public async execute(body: CancelarSolicitudDto) {
    const qr = this.dynamicQR(gcmContextFactory(body.contextCode));
    await qr.connect();
    await qr.startTransaction();
    try {
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const solicitud = await solicitudRp.findOne({ where: { id: body.solicitudId } });
      solicitud.estadoCode = ESTADOS.SOL_CANCELADA.getCode();
      await solicitudRp.save(solicitud);
      await this.createCambioEstado(qr, {
        solicitud,
        informacionAdicional: body.observaciones ? body.observaciones : null,
        estadoEspecifico: ESTADOS_ESPECIFICOS.SOL_CANCELADA,
        estado: ESTADOS.SOL_CANCELADA,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
