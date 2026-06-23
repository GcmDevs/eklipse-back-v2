import { BaseSource } from '@common/infrastructure/services';
import { PollaMundialistaApuestaOrm, PollaMundialistaOrm } from '@inn/orm/inn/polla-mundialista';
import { PronosticoPayload } from '@inn/polla-mundialista/presentation/dtos';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PronosticarPartidoImpl extends BaseSource {
  async execute(partidoId: number, payload: PronosticoPayload): Promise<boolean> {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const partidoRp = this.ekConn.getRepository(PollaMundialistaOrm);
      const apuestaRp = this.qr.manager.getRepository(PollaMundialistaApuestaOrm);

      const partido = await partidoRp.findOne({ where: { id: partidoId } });

      if (!partido) throw new Error('El partido no existe');
      if (partido.isCerrado) throw new Error('El partido está cerrado para pronósticos');

      let apuesta = await apuestaRp.findOne({
        where: { pollaMundialistaId: partidoId, usuarioId: this.auth.id },
      });

      if (!apuesta) {
        apuesta = apuestaRp.create({
          pollaMundialistaId: partidoId,
          usuarioId: this.auth.id,
          isExterno: !this.auth.isDim,
        });
      }

      apuesta.localPrediccion = payload.localPrediccion;
      apuesta.visitantePrediccion = payload.visitantePrediccion;

      await apuestaRp.save(apuesta);
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
