import { Request } from 'express';
import { In } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { jornadasDietaTypeFactory, JORNADAS_DIETA, JornadaType } from '@lgc/die/domain/types/local';
import {
  dieCentroFactory,
  dietaEstadoFactory,
  dietaSubgrupoFactory,
  dietaJornadaFactory,
} from '../factories';
import { CreateDietaDto, DietaDto } from '@lgc/die/presentation/dtos';
import { getDateToString, removeTimeZone } from '@common/application/services';
import { fetchCamasRegistradasEnJornadaQuery } from '../queries';
import { TransactionDietaService } from './transaction';
import { validRangeForJornada } from '../utils';
import {
  DieCentroOrm,
  DieEstadoOrm,
  DieJornadaOrm,
  DieSubgrupoOrm,
  DietaConfExtraOrm,
  SubgrupoOrm,
} from '../models/local';
import { ScheduleOrm } from '../models/diets';
import { DIE_AUTHORITIES } from '@lgc/die/application/constants';
import { DietasBaseSource } from '../sources';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';

let _store: { ctx: GcmContextType; executing: boolean; time: Date }[] = [
  { ctx: GCM_CONTEXTS.ALTACENTRO, executing: false, time: new Date() },
  { ctx: GCM_CONTEXTS.AGUACHICA, executing: false, time: new Date() },
  { ctx: GCM_CONTEXTS.SANJUAN, executing: false, time: new Date() },
  { ctx: GCM_CONTEXTS.VALLEDUPAR, executing: false, time: new Date() },
];

interface CamaEnJornadaI {
  id: number;
  camaId: number;
  pacienteId: number;
  nombrePaciente: string;
}

@Injectable()
export class CreateDietasBySubgrupoImpl extends DietasBaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private _transaction: TransactionDietaService
  ) {
    super(request);
  }

  public async execute(payload: CreateDietaDto) {
    if (
      _store.find(e => e.ctx === this.auth.context).executing ||
      new Date().getTime() - _store.find(e => e.ctx === this.auth.context).time.getTime() < 1000
    ) {
      throw new BadRequestException(
        'Hay un proceso ejecutandose al mismo tiempo, intentalo nuevamente'
      );
    }

    _store.find(e => e.ctx === this.auth.context).executing = true;
    _store.find(e => e.ctx === this.auth.context).time = new Date();

    try {
      const transaction = await this._transaction.execute(false, {
        usuarioId: this.auth.user.id,
        subgrupoId: payload.subgrupoId,
        tipo: 1,
        jornada: payload.jornadaCode,
      });

      const { subgrupoId, dietas } = payload;

      const fecha = removeTimeZone(new Date());
      const fechaFt = getDateToString(fecha);
      const dieJorType = jornadasDietaTypeFactory(payload.jornadaCode);

      const centro = await this.fetchCentro(payload.centroId);
      const horario = (await this.fetchHorarios(centro.id, payload.horarioId)) as ScheduleOrm;

      const filters = await this._filters(
        centro.id,
        horario.id,
        dietas,
        subgrupoId,
        fechaFt,
        dieJorType
      );

      if (!filters.success) {
        await this._transaction.execute(false, {}, transaction, filters.message);
        return filters;
      }

      let dieJornadaId = filters.dieJornadaId;

      const camaIds = payload.dietas.map(die => die.camaId);
      const pacienteIds = payload.dietas.map(die => die.pacienteId);

      const camasEnJornada: CamaEnJornadaI[] = await this.conn.query(
        fetchCamasRegistradasEnJornadaQuery(fechaFt, payload.horarioId, camaIds, pacienteIds)
      );

      await this.qr.connect();
      try {
        await this.qr.startTransaction();
        const dietaSubgrupoRp = this.qr.manager.getRepository(DieSubgrupoOrm);
        const dieConfigRp = this.qr.manager.getRepository(DietaConfExtraOrm);
        const dietaJornadaRp = this.qr.manager.getRepository(DieJornadaOrm);
        const dietaCentroRp = this.qr.manager.getRepository(DieCentroOrm);
        const dieEstadoRp = this.qr.manager.getRepository(DieEstadoOrm);
        const subgrupoRp = this.qr.manager.getRepository(SubgrupoOrm);

        const camasEnJornadaIds: number[] = [];

        camasEnJornada.forEach(c => {
          camasEnJornadaIds.push(c.id);
        });

        if (camasEnJornada.length) {
          const dietasRegistradas = await dieEstadoRp.find({
            where: { id: In(camasEnJornadaIds) },
          });

          dietasRegistradas.map(el => {
            el.isEliminado = true;
          });

          await dieEstadoRp.save(dietasRegistradas);
        }

        const subgrupoActual = await subgrupoRp.findOne({
          where: { id: subgrupoId },
        });

        let dietaCentro = await dietaCentroRp.findOne({
          where: { fecha: fechaFt, centroId: centro.id },
        });

        if (!dietaCentro) {
          const newDietaCentro = dieCentroFactory({
            centroId: centro.id,
            fecha: fechaFt,
          });

          dietaCentro = await dietaCentroRp.save(newDietaCentro);
        }

        let dietaJornada: DieJornadaOrm;

        if (dieJornadaId) {
          dietaJornada = await dietaJornadaRp.findOne({ where: { id: dieJornadaId } });
        }

        if (!dietaJornada) {
          const newDietaJornada = dietaJornadaFactory({
            dietaCentroId: dietaCentro.id,
            fecha: fechaFt,
            jornada: dieJorType,
            horarioId: horario.id,
            centroId: centro.id,
          });

          dietaJornada = await dietaJornadaRp.save(newDietaJornada);

          dieJornadaId = dietaJornada.id;

          if (dieJorType === JORNADAS_DIETA.DESAYUNO) dietaCentro.jornadaDesayunoId = dieJornadaId;
          if (dieJorType === JORNADAS_DIETA.ALMUERZO) dietaCentro.jornadaAlmuerzoId = dieJornadaId;
          if (dieJorType === JORNADAS_DIETA.CENA) dietaCentro.jornadaCenaId = dieJornadaId;
          await dietaCentroRp.save(dietaCentro);
        }

        let dieSubgrupo = await dietaSubgrupoRp.findOne({
          where: { dieJornadaId, subGrupoId: payload.subgrupoId },
        });

        if (!dieSubgrupo) {
          const newDietaSubgrupo = dietaSubgrupoFactory({
            dieJornadaId: dietaJornada.id,
            subgrupoActual,
            userAuthId: this.auth.user.id,
          });

          dieSubgrupo = await dietaSubgrupoRp.save(newDietaSubgrupo);
        }

        let customDietaEstados: DietaConfExtraOrm[] = [];

        const camasIds: number[] = [];
        const pacientesIds: number[] = [];

        dietas.forEach(die => {
          camasIds.push(die.camaId);
          pacientesIds.push(die.pacienteId);
        });

        if (dietas.length) {
          customDietaEstados = await dieConfigRp.find({ where: { pacienteId: In(pacientesIds) } });
          customDietaEstados.map(c => {
            c.verifyIfConfigIsLessThanMaxDays();
            if (c.isLessThanMaxDays) c.fechaUltimaDietaRegistrada = new Date();
          });
          if (customDietaEstados.length) await dieConfigRp.save(customDietaEstados);
        }

        const dietaEstados: DieEstadoOrm[] = [];

        dietas.forEach(dieta => {
          const newDieEstado = dietaEstadoFactory({
            jornada: dieJorType,
            customDietaEstados,
            dieta,
            dieSubgrupoId: dieSubgrupo.id,
            context: this.auth.context,
          });

          newDieEstado.enAislamiento = dieta.enAislamiento;

          if (newDieEstado.combinacionCode) dietaEstados.push(newDieEstado);
        });

        await dieEstadoRp.save(dietaEstados);

        await this.qr.commitTransaction();
        await this._transaction.execute(true, {}, transaction);
        return {
          success: true,
          message: `El subgrupo fue registrado en la jornada de dieta exitosamente`,
          data: [],
        };
      } catch (error: any) {
        await this.qr.rollbackTransaction();
        await this._transaction.execute(false, {}, transaction, error.message);
        return { success: false, message: error.message };
      } finally {
        await this.qr.release();
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      _store.find(e => e.ctx === this.auth.context).executing = false;
    }
  }

  private async _filters(
    centroId: number,
    horarioId: number,
    dietas: DietaDto[],
    subgrupoId: number,
    fecha: Date,
    dieJorType: JornadaType
  ) {
    const canIgnoreHorario = await this.hasAnyAuthority([
      DIE_AUTHORITIES.ADMINISTRADOR,
      DIE_AUTHORITIES.REGISTRAR_EXTRATIME,
    ]);

    const centro = await this.fetchCentro(centroId);
    const horario = (await this.fetchHorarios(centro.id, horarioId)) as ScheduleOrm;

    if (!validRangeForJornada(horario, canIgnoreHorario)) {
      const message = 'Ha expirado la jornada';
      return {
        success: false,
        message,
        data: [],
      };
    }

    if (!dietas.length) {
      return {
        success: false,
        message: 'Debe existir al menos una dieta',
        data: [],
      };
    }

    let dieJornadaId: number;

    const dieCentroRp = this.conn.getRepository(DieCentroOrm);
    const dieSubgrupoRp = this.conn.getRepository(DieSubgrupoOrm);

    const dieCentro = await dieCentroRp.findOne({ where: { fecha, centroId } });

    if (dieCentro) {
      if (dieJorType === JORNADAS_DIETA.DESAYUNO) dieJornadaId = dieCentro.jornadaDesayunoId;
      if (dieJorType === JORNADAS_DIETA.ALMUERZO) dieJornadaId = dieCentro.jornadaAlmuerzoId;
      if (dieJorType === JORNADAS_DIETA.CENA) dieJornadaId = dieCentro.jornadaCenaId;
    }

    if (dieJornadaId) {
      const dieSubgrupo = await dieSubgrupoRp.findOne({
        where: { dieJornadaId, subGrupoId: subgrupoId },
      });

      if (dieSubgrupo) {
        return {
          success: false,
          message: 'Este subgrupo ya se encuentra registrado en esta jornada',
          data: [],
        };
      }
    }

    return {
      success: true,
      dieJornadaId,
    };
  }
}
