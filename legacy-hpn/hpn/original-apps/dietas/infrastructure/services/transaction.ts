import { Injectable } from '@nestjs/common';
import { TransactionDietaOrm } from '../models/local';
import { JornadaCode, TransactionDietaTypeCode } from '@hpn/ori/die/domain/types/local';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class TransactionDietaService extends BaseSource {
  async execute(
    success: boolean,
    payload: {
      usuarioId?: number;
      pacienteId?: number;
      subgrupoId?: number;
      tipo?: TransactionDietaTypeCode;
      jornada?: JornadaCode;
    } = {},
    entity?: TransactionDietaOrm,
    detalleError?: string
  ) {
    const repo = this.conn.getRepository(TransactionDietaOrm);
    if (!entity) {
      const { usuarioId, subgrupoId, pacienteId: estanciaId, tipo, jornada } = payload;
      const newEnt = new TransactionDietaOrm();
      newEnt.estanciaId = estanciaId;
      newEnt.jornada = jornada;
      newEnt.subgrupoId = subgrupoId;
      newEnt.usuarioId = usuarioId;
      newEnt.tipo = tipo;
      newEnt.createdAt = new Date();
      newEnt.success = success;

      return await repo.save(newEnt);
    } else {
      entity.success = success;
      entity.detalleError = detalleError ? detalleError.slice(0, 190) : detalleError;
      return await repo.save(entity);
    }
  }
}
