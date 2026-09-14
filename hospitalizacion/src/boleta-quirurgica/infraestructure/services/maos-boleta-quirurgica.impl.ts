import { BaseSource } from '@common/infrastructure/services';
import { GuardarMaosDto } from '@hpn/boleta-quirurgica/presentation/dto';
import { Injectable } from '@nestjs/common';
import { BoletaQuirurgicaMaosOrm, BoletaQuirurgicaProgramacionOrm } from '../orm';
import { trim } from '@hpn/boleta-quirurgica/shared/utils/utils';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';

@Injectable()
export class MaosBoletaQuirurgicaImpl extends BaseSource {
  public async execute(body: GuardarMaosDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const maosRp = this.qr.manager.getRepository(BoletaQuirurgicaMaosOrm);
      const programacionRp = this.qr.manager.getRepository(BoletaQuirurgicaProgramacionOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const maos = await maosRp.findOne({ where });
      const programacion = await programacionRp.findOne({ where });

      if (trim(programacion?.reqMaos).toUpperCase() === 'NO') {
        const finalizedPayload = { estado2Maos: 'SI' };

        if (!maos) {
          await maosRp.save(
            maosRp.create({
              ingreso: body.ingreso,
              folio: body.folio,
              fechaEntrega: null,
              maosSolicitado: '',
              casaComercial: '',
              estadoMaos: '',
              ...finalizedPayload,
              existencia: '',
            })
          );
        } else {
          await maosRp.update(where, finalizedPayload);
        }

        await this.qr.commitTransaction();
        return { skipped: true, finalized: true };
      }

      const payload = {
        maosSolicitado: trim(body.maosSolicitado),
        estadoMaos: trim(body.estadoMaos),
        casaComercial: trim(body.casaComercial),
        fechaEntrega: new Date(body.fechaEntrega),
        estado2Maos: trim(body.estado2Maos),
        existencia: trim(body.existencia),
      };

      if (!maos) {
        await maosRp.save(
          maosRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            ...payload,
          })
        );

        await this.qr.commitTransaction();
        return { created: true, updated: false };
      }

      await maosRp.update(where, payload);

      await this.qr.commitTransaction();
      return { created: false, updated: true };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando maos de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
