import { UpdateDietaDto } from '@lgc/die/application/data-transfers';
import { validRangeForJornada } from '../utils';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { TransactionDietaService } from './transaction';
import { In } from 'typeorm';
import { dietaEstadoFactory } from '../factories';
import { BaseSource } from '@common/infrastructure/services';
import {
  DieCentroOrm,
  DieEstadoOrm,
  DieJornadaOrm,
  DieSubgrupoOrm,
  DietaConfExtraOrm,
} from '../models/local';
import { ESTADOS_DIETA } from '@lgc/die/domain/types/local';
import { ScheduleOrm } from '../models/diets';
import { DIE_AUTHORITIES } from '@lgc/die/application/constants';
import { fetchCamasRegistradasEnJornadaQuery } from '../queries';
import { getDateToString, removeTimeZone } from '@common/application/services';

interface CamaEnJornadaI {
  id: number;
  camaId: number;
  pacienteId: number;
  nombrePaciente: string;
}

@Injectable()
export class ActualizarDietasImpl extends BaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private _transaction: TransactionDietaService
  ) {
    super(request);
  }

  async execute(payload: UpdateDietaDto): Promise<boolean> {
    const dieCentroRp = this.conn.getRepository(DieCentroOrm);
    const dieJornadaRp = this.conn.getRepository(DieJornadaOrm);
    const dieSubgrupoRp = this.conn.getRepository(DieSubgrupoOrm);
    const scheduleRp = this.conn.getRepository(ScheduleOrm);

    const dieCentro = await dieCentroRp.findOne({ where: { id: payload.dieCentroId } });

    const dieJornada = await dieJornadaRp.findOne({
      where: { id: payload.dieJornadaId, dieCentroId: payload.dieCentroId },
      relations: ['horario'],
    });
    dieJornada.setTypes();

    const dieSubgrupo = await dieSubgrupoRp.findOne({
      where: { id: payload.dieSubgrupoId, dieJornadaId: payload.dieJornadaId },
    });

    if (!dieCentro || !dieJornada || !dieSubgrupo) {
      throw new BadRequestException('Uno o mas registros relacionados no existen');
    }

    const transaction = await this._transaction.execute(false, {
      jornada: dieJornada.jornada.getCode(),
      usuarioId: this.auth.user.id,
      pacienteId: payload.pacienteId,
      tipo: 2,
    });

    const canIgnoreHorario = await this.hasAnyAuthority([
      DIE_AUTHORITIES.ADMINISTRADOR,
      DIE_AUTHORITIES.REGISTRAR_EXTRATIME,
    ]);

    const jornada = await scheduleRp.findOne({
      where: { clientId: dieCentro.centroId, id: dieJornada.horarioId },
    });

    jornada.timeInMinutesToDate();

    jornada.startTime = new Date(jornada.startTime);
    jornada.endTime = new Date(jornada.endTime);

    if (!validRangeForJornada(jornada, canIgnoreHorario)) {
      const errorMsg = 'Ha expirado la jornada';
      throw new BadRequestException(`${errorMsg}, ya no puede modificarla`);
    }

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      const dieConfigRp = this.qr.manager.getRepository(DietaConfExtraOrm);
      const dieEstadoRp = this.qr.manager.getRepository(DieEstadoOrm);

      if (!payload.id) {
        const fecha = removeTimeZone(new Date());
        const fechaFt = getDateToString(fecha);

        const camasEnJornada: CamaEnJornadaI[] = await this.qr.query(
          fetchCamasRegistradasEnJornadaQuery(fechaFt, payload.horarioId, [0], [payload.pacienteId])
        );

        const camasEnJornadaIds: number[] = [];

        camasEnJornada.forEach(c => {
          camasEnJornadaIds.push(c.id);
        });

        if (camasEnJornadaIds.length) {
          const dietasRegistradas = await dieEstadoRp.find({
            where: { id: In(camasEnJornadaIds) },
          });

          dietasRegistradas.map(el => {
            el.isEliminado = true;
          });

          await dieEstadoRp.save(dietasRegistradas);
        }
      }

      let dieEstado = await dieEstadoRp.findOne({
        where: [
          {
            id: payload.id,
            pacienteId: payload.pacienteId,
            camaId: payload.camaId,
            dieSubgrupoId: payload.dieSubgrupoId,
            isEliminado: false,
          },
        ],
      });

      if (dieEstado) {
        dieEstado.setTypes();
        if (dieEstado.estado !== ESTADOS_DIETA.PENDIENTE) {
          throw new BadRequestException(
            `Esta dieta está en estado ${dieEstado.estado.getForHumans()}`
          );
        }
      }

      let customDietaEstados: DietaConfExtraOrm;

      customDietaEstados = await dieConfigRp.findOne({ where: { pacienteId: payload.pacienteId } });
      if (customDietaEstados) {
        customDietaEstados.verifyIfConfigIsLessThanMaxDays();
      }

      dieEstado = dietaEstadoFactory({
        dieSubgrupoId: payload.dieSubgrupoId,
        dieta: {
          id: dieEstado ? dieEstado.id : undefined,
          pacienteId: payload.pacienteId,
          camaId: payload.camaId,
          dietaConfig: payload.dietaConfig,
          observacion: payload.observacion,
          enAislamiento: payload.enAislamiento,
        },
        jornada: dieJornada.jornada,
        customDietaEstados: customDietaEstados ? [customDietaEstados] : [],
        context: this.auth.context,
      });

      await dieEstadoRp.save(dieEstado);

      if (customDietaEstados) {
        if (customDietaEstados.isLessThanMaxDays) {
          customDietaEstados.fechaUltimaDietaRegistrada = new Date();
          await dieConfigRp.save(customDietaEstados);
        }
      }

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      await this._transaction.execute(false, {}, transaction, error.message);
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
