import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ConfDietExtraPayload } from '@hpn/ori/die/application/data-transfers';
import { TransactionDietaService } from './transaction';
import { dataToConfDieExtra } from '../factories';
import { BaseSource } from '@common/infrastructure/services';
import { DietaConfExtraOrm } from '../models/local';

export class ConfigurarDietasExtraordinariasImpl extends BaseSource {
  constructor(@Inject(REQUEST) request: Request, private _transaction: TransactionDietaService) {
    super(request);
  }

  public async fetchConfig(ingreso: number): Promise<any> {
    const repository = this.qr.manager.getRepository(DietaConfExtraOrm);
    const result = await repository.findOneOrFail({ where: { pacienteId: ingreso } });
    if (result) {
      result.verifyIfConfigIsLessThanMaxDays();
      if (!result.isLessThanMaxDays) {
        result.incluyeDietaFamiliarDesayuno = false;
        result.incluyeDietaFamiliarAlmuerzo = false;
        result.incluyeDietaFamiliarCena = false;
        result.incluyeMeriendaDesayuno = false;
        result.incluyeMeriendaAlmuerzo = false;
        result.incluyeMeriendaCena = false;
      }
    }
    return result;
  }

  public async execute(payload: ConfDietExtraPayload): Promise<any> {
    const transaction = await this._transaction.execute(false, {
      usuarioId: this.auth.user.id,
      pacienteId: payload.pacienteId,
      jornada: payload.jornada,
      tipo: 4,
    });

    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      let message = 'Configuración de dietas extra realizada correctamente.';

      const repository = this.qr.manager.getRepository(DietaConfExtraOrm);
      const oldEntity = await repository.findOne({ where: { pacienteId: payload.pacienteId } });
      const newEntity = dataToConfDieExtra(payload, oldEntity);

      await repository.save(newEntity);

      await this.qr.commitTransaction();

      await this._transaction.execute(true, {}, transaction);
      return {
        success: true,
        message,
      };
    } catch (error) {
      await this.qr.rollbackTransaction();

      await this._transaction.execute(false, {}, transaction, error.message);

      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
