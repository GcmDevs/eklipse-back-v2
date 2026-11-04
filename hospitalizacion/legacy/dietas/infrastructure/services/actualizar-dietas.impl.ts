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
  ScheduleOrm,
  TransactionDietaOrm,
} from '../orm';
import { ESTADOS_DIETA } from '@lgc/die/domain/types';
import { fetchCamasRegistradasEnJornadaQuery } from '../queries';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { HPN_AUTHORITIES } from '@authorities';
import { bloquearDietas } from '../utils/bloqueo-dietas';

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
    // Only the persisted date is read before the lock; all mutable state is read again below.
    const referencia = await this.conn.getRepository(DieJornadaOrm).findOne({
      where: { id: payload.dieJornadaId, dieCentroId: payload.dieCentroId },
      select: { id: true, fecha: true },
    });
    if (!referencia) {
      throw new BadRequestException('Uno o mas registros relacionados no existen');
    }
    const fechaJornada = new Date(referencia.fecha);
    const canIgnoreHorario = await this.hasAnyAuthority([
      ADMIN_AUTHORITY,
      HPN_AUTHORITIES.DIETAS.REGISTRAR_IGNORA_JORNADA,
    ]);
    let transaction: TransactionDietaOrm;
    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      await bloquearDietas(this.qr, this.auth.context, fechaJornada);
      const dieCentro = await this.qr.manager.getRepository(DieCentroOrm).findOne({
        where: { id: payload.dieCentroId },
      });
      const dieJornada = await this.qr.manager.getRepository(DieJornadaOrm).findOne({
        where: { id: payload.dieJornadaId, dieCentroId: payload.dieCentroId },
        relations: ['horario'],
      });
      const dieSubgrupo = await this.qr.manager.getRepository(DieSubgrupoOrm).findOne({
        where: { id: payload.dieSubgrupoId, dieJornadaId: payload.dieJornadaId },
      });
      if (
        !dieCentro ||
        !dieJornada ||
        !dieSubgrupo ||
        new Date(dieJornada.fecha).getTime() !== fechaJornada.getTime()
      ) {
        throw new BadRequestException('Uno o mas registros relacionados no existen');
      }
      dieJornada.setTypes();
      transaction = await this._transaction.execute(false, {
        jornada: dieJornada.jornada.getCode(),
        usuarioId: this.auth.user.id,
        pacienteId: payload.pacienteId,
        tipo: 2,
      });
      const jornada = await this.qr.manager.getRepository(ScheduleOrm).findOne({
        where: { clientId: dieCentro.centroId, id: dieJornada.horarioId },
      });
      if (!jornada) {
        throw new BadRequestException('Este horario no está relacionado a este centro');
      }
      jornada.timeInMinutesToDate();
      if (!validRangeForJornada(jornada, canIgnoreHorario)) {
        throw new BadRequestException('Ha expirado la jornada, ya no puede modificarla');
      }
      const dieConfigRp = this.qr.manager.getRepository(DietaConfExtraOrm);
      const dieEstadoRp = this.qr.manager.getRepository(DieEstadoOrm);

      if (!payload.id) {
        const camasEnJornada: CamaEnJornadaI[] = await this.qr.query(
          fetchCamasRegistradasEnJornadaQuery(
            fechaJornada,
            dieJornada.horarioId,
            [0],
            [payload.pacienteId]
          )
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

      transaction.success = true;
      await this.qr.manager.getRepository(TransactionDietaOrm).save(transaction);
      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (this.qr.isTransactionActive) await this.qr.rollbackTransaction();
      if (transaction) {
        await this._transaction.execute(false, {}, transaction, error.message);
      }
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
