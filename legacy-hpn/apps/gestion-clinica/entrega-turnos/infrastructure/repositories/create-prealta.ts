import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { TABLE_NAMES } from '@common/application/constants';
import { ETPreAltaOrm } from '@orm/gcn/entrega-turno/prealta.orm';
import { CreatePrealtaDto } from '@gestion-clinica/entrega-turnos/presentation/dtos';

@Injectable()
export class CreatePrealtaImpl extends BaseSource {
  public async fetch(ingresoId: number): Promise<ETPreAltaOrm[]> {
    await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, ingresoId);

    const prealtaRp = this.conn.getRepository(ETPreAltaOrm);

    const prealta = await prealtaRp.find({
      where: { ingresoId },
      relations: ['usuario'],
    });

    return prealta;
  }

  public async create(body: CreatePrealtaDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, body.ingresoId);

      await this.verifyEntityExist('GENPACIEN', body.pacienteId);

      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const prealtaRp = this.qr.manager.getRepository(ETPreAltaOrm);

      const prealta = await prealtaRp.findOne({
        where: { ingresoId: body.ingresoId },
      });

      if (prealta) {
        throw new BadRequestException(
          `El paciente ya tiene prealta registrada desde el ${prealta.fechaCreacion.toLocaleString()} (${
            prealta.tiempoPrealta
          } horas).`
        );
      }

      const newPrealta = new ETPreAltaOrm();

      newPrealta.ingresoId = body.ingresoId;
      newPrealta.pacienteId = body.pacienteId;
      newPrealta.usuarioId = this.auth.id;
      newPrealta.fechaCreacion = new Date();
      newPrealta.tiempoPrealta = body.tiempoPrealta;
      newPrealta.observacion = body.observacion;

      await prealtaRp.save(newPrealta);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async update(body: CreatePrealtaDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, body.ingresoId);

      await this.verifyEntityExist('GENPACIEN', body.pacienteId);

      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const prealtaRp = this.qr.manager.getRepository(ETPreAltaOrm);

      const prealta = await prealtaRp.findOne({
        where: { ingresoId: body.ingresoId },
      });

      if (!prealta) {
        throw new BadRequestException(`El paciente no tiene prealta registrada.`);
      }

      prealta.tiempoPrealta = body.tiempoPrealta;
      prealta.observacion = body.observacion;
      prealta.usuarioId = this.auth.id;
      prealta.fechaCreacion = new Date();

      await prealtaRp.save(prealta);

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
