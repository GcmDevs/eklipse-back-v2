import { BaseSource } from '@common/infrastructure/services';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';
import { GuardarObservacionDto, ObservacionesDto } from '@hpn/boleta-quirurgica/presentation/dto';
import { Injectable } from '@nestjs/common';
import { BoletaQuirurgicaObservacionOrm } from '../orm';
import { trim } from '@hpn/boleta-quirurgica/shared/utils/utils';

@Injectable()
export class ObservacionBoletaQuirurgicaImpl extends BaseSource {
  public async executePost(body: GuardarObservacionDto): Promise<any> {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const observacionRp = this.qr.manager.getRepository(BoletaQuirurgicaObservacionOrm);
      const usuario = this.auth.user.fullName;

      await observacionRp.save(
        observacionRp.create({
          ingreso: body.ingreso,
          folio: body.folio,
          observacion: body.observacion,
          fechaObservacion: new Date(),
          gestor: trim(body.gestor),
          usuario,
        })
      );

      await this.qr.commitTransaction();
      return { created: true, usuario };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando observacion de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async executeGet(body: ObservacionesDto): Promise<any> {
    try {
      const observacionesRp = this.qr.manager.getRepository(BoletaQuirurgicaObservacionOrm);
      const where = { gestor: body.gestor, ingreso: body.ingreso, folio: body.folio };
      const observaciones = await observacionesRp.find({
        where,
        order: { fechaObservacion: 'DESC' },
      });
      return observaciones;
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error consultando observaciones de boleta quirurgica');
    }
  }
}
