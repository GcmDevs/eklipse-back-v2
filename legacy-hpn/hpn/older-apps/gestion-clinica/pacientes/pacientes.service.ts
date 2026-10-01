import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckOrm } from './entities';
import { UbicacionPacienteTypeCode, estadoPacienteTypeFactory } from './types';
import { getPacientesRevaloracion } from './get-pacientes-revaloracion.query';
import { BaseSource } from '@common/infrastructure/services';

const daysUntilNewCheck = 15;
@Injectable()
export class PacientesService extends BaseSource {
  public async canAddNewCheck(pacienteId: number) {
    try {
      let canAddNewCheck = { success: true, lastUpdated: null, lastLocation: null };
      const checkRpTemp = this.conn.getRepository(CheckOrm);

      const check = await checkRpTemp.findOne({
        where: { pacienteId: pacienteId },
        order: { id: 'DESC' },
      });

      if (check) {
        const diffInDays = (new Date().getTime() - check.createdAt.getTime()) / 1000 / 60 / 60 / 24;

        if (diffInDays < daysUntilNewCheck)
          canAddNewCheck = {
            success: false,
            lastUpdated: check.createdAt,
            lastLocation: estadoPacienteTypeFactory(check.ubicacion).getForHumans(),
          };
      }

      return canAddNewCheck;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async addCheck(pacienteId: number, ubicacion: UbicacionPacienteTypeCode) {
    let transactionWasStarted = false;
    try {
      const checkRpTemp = this.conn.getRepository(CheckOrm);
      const check = await checkRpTemp.find({ where: { pacienteId: pacienteId } });
      check.forEach(el => {
        const diffInDays = (new Date().getTime() - el.createdAt.getTime()) / 1000 / 60 / 60 / 24;

        if (diffInDays < daysUntilNewCheck)
          throw new Error(`El usuario fue checkeado hace menos de ${daysUntilNewCheck} días`);
      });

      transactionWasStarted = true;
      await this.qr.connect();

      await this.qr.startTransaction();
      const checkRp = this.qr.manager.getRepository(CheckOrm);
      const newCheck = new CheckOrm();
      newCheck.pacienteId = pacienteId;
      newCheck.usuarioId = this.auth.user.id;
      newCheck.ubicacion = ubicacion;
      newCheck.createdAt = new Date();
      const result = await checkRp.save(newCheck);

      await this.qr.commitTransaction();
      return result;
    } catch (error) {
      if (transactionWasStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionWasStarted) await this.qr.release();
    }
  }

  public async pacientesRevaloracion(): Promise<any[]> {
    try {
      const pacientesRevaloracion = await this.conn.query(getPacientesRevaloracion());
      return pacientesRevaloracion;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
