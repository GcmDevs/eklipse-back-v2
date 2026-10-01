import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  CambioTurnoOrm,
  EntregaTurnoOrm,
} from '@orm/gcn';
import { TABLE_NAMES } from '@common/application/constants';

@Injectable()
export class MedicoImpl extends BaseSource {

  public async fetch(turnoId: number) {
    const cambioTurnoRp = this.conn.getRepository(CambioTurnoOrm);

    const medicosEnTurnoActual = await cambioTurnoRp.find({
      where: {
        entregaTurno: { id: turnoId, isActivo: true }
      },
      relations: ['medico', 'entregaTurno']
    });

    const medicosTurno = medicosEnTurnoActual.map(cambio => {
      return {
        id: cambio.medicoId,
        nombre: cambio.medico.nombreCompleto,
        cedula: cambio.medico.cedula,
      }
    })

    return medicosTurno
  }

  public async create(body: { medicoId: number, turnoId: number }): Promise<boolean> {
    let transactionStarted = false;
    try {

      await this.verifyEntityExist(TABLE_NAMES.gen.usu.usuarios, body.medicoId);

      await this.verifyEntityExist(TABLE_NAMES.hpn.entregaTurno.index, body.turnoId);

      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const cambioTurnoRp = this.qr.manager.getRepository(CambioTurnoOrm);

      const entregaTurnoRp = this.qr.manager.getRepository(EntregaTurnoOrm);

      const entregaTurnoActivo = await entregaTurnoRp.findOne({ where: { id: body.turnoId } })

      if (entregaTurnoActivo.medicoEntregaTurnoId !== this.auth.id) {
        throw new Error(`Usted no puede agregar medico`);
      }

      if (!entregaTurnoActivo.isActivo) {
        throw new Error(`El turno se encuentra inactivo`);
      }

      const medicoEnTurnoActual = await cambioTurnoRp.findOne({
        where:
          { medicoId: body.medicoId, entregaTurnoId: body.turnoId }
      });


      if (medicoEnTurnoActual) {
        throw new Error(
          `El medico ya se encuentra asignado como ayudante`
        );
      }

      await cambioTurnoRp.save(cambioTurnoRp.create({
        medicoId: body.medicoId,
        entregaTurnoId: body.turnoId,
        motivo: 'AYUDANTE',
        fecha: new Date(),
        tipo: 2
      }))

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
