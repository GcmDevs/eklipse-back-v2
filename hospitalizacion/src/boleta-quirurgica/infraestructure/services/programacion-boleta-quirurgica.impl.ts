import { BaseSource } from '@common/infrastructure/services';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';
import { GuardarProgramacionDto } from '@hpn/boleta-quirurgica/presentation/dto';
import { Injectable } from '@nestjs/common';
import { BoletaQuirurgicaProgramacionOrm } from '../orm';
import { trim } from '@hpn/boleta-quirurgica/shared/utils/utils';

@Injectable()
export class ProgramacionBoletaQuirurgicaImpl extends BaseSource {
  public async execute(body: GuardarProgramacionDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const programacionRp = this.qr.manager.getRepository(BoletaQuirurgicaProgramacionOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const programacion = await programacionRp.findOne({ where });
      const payload = {
        sede: trim(body.institucion),
        fechaRecepcion: new Date(body.fechaRecepcion),
        estado: '',
        programada: trim(body.programada),
        fechaProgramacion: new Date(body.fechaProgramacion),
        observacion: '',
        estadoProg: trim(body.estadoProg),
      };

      if (!programacion) {
        await programacionRp.save(
          programacionRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            reqMaos: '',
            ...payload,
          })
        );

        await this.qr.commitTransaction();
        return { created: true, updated: false };
      }

      await programacionRp.update(where, payload);

      await this.qr.commitTransaction();
      return { created: false, updated: true };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando programacion de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
