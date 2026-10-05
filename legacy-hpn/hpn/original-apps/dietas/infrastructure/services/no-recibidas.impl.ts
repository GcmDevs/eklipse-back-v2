import { Between, In, IsNull, Like, MoreThan } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { groupByKeyExtend } from '@hpn/ori/die/presentation/helpers';
import { CatalogOrm, DimItdDietOrm, ScheduleOrm } from '../models/diets';
import { CentroOrm, DieEstadoOrm, DieJornadaOrm, DieSubgrupoOrm } from '../models/local';
import { DietaNoRecibidaDto } from '@hpn/ori/die/presentation/dtos';
import { getDateToString } from '@common/application/services';
import {
  CONSISTENCIAS_LIQUIDAS,
  CONSISTENCIAS_SIN_VALOR,
  CONSISTENCIAS_SOLIDAS,
  DIETAS_FAMILIARES,
  DIETAS_INEXISTENTES,
  MERIENDAS,
  TIPOS,
} from '../precio-dietas/common';

@Injectable()
export class ItdBillingImpl extends BaseSource {
  public async fetchCentros() {
    try {
      const centroRp = this.conn.getRepository(CentroOrm);
      const centros = await centroRp.find({ relations: ['schedules'] });
      return centros;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchByDay(centro: CentroOrm, date: Date) {
    const billingByDiets = await this.fetchByDateRange(centro, date, date, true);

    const response = {
      amountReceived: 0,
      amountUnreceived: 0,
      totalReceived: 0,
      totalUnreceived: 0,
      centro: undefined,
      schedules: [],
    };

    const groupedBySchedule = groupByKeyExtend({
      data: billingByDiets,
      colWithKey: 'scheduleForHumans',
      colNameFromType: true,
      colWithName: 'schedule',
      colNamePropertyOnTypeWithName: 'id',
    });

    groupedBySchedule.map(sc => {
      const originalName = sc.key;
      sc.key = sc.name;
      sc.name = originalName;
      (sc as any).amountReceived = 0;
      (sc as any).amountUnreceived = 0;
      (sc as any).totalReceived = 0;
      (sc as any).totalUnreceived = 0;
      const groupedByConfig = groupByKeyExtend({
        data: sc.rows,
        colWithKey: 'compactConfig',
        colWithName: 'configInTxt',
      });

      groupedByConfig.map(g => {
        g.rows.map((r, i) => {
          if (!i) (g as any).value = r.value;
          delete r.configInTxt;
          delete r.compactConfig;
          delete r.value;
          delete r.schedule;
          delete r.scheduleForHumans;
        });

        (g as any).amountReceived = g.rows.filter(r => r.isReceived).length;
        (g as any).amountUnreceived = g.rows.filter(r => !r.isReceived).length;
        (g as any).totalReceived = (g as any).value * (g as any).amountReceived;
        (g as any).totalUnreceived = (g as any).value * (g as any).amountUnreceived;
        (sc as any).amountReceived += (g as any).amountReceived;
        (sc as any).amountUnreceived += (g as any).amountUnreceived;
        (sc as any).totalReceived += (g as any).totalReceived;
        (sc as any).totalUnreceived += (g as any).totalUnreceived;
      });

      (sc as any).diets = groupedByConfig;

      delete sc.rows;
    });

    groupedBySchedule.forEach(g => {
      response.amountReceived += (g as any).amountReceived;
      response.amountUnreceived += (g as any).amountUnreceived;
      response.totalReceived += (g as any).totalReceived;
      response.totalUnreceived += (g as any).totalUnreceived;
    });

    response.schedules = groupedBySchedule;

    return response;
  }

  public async fetchByDateRange(
    centro: CentroOrm,
    startDate: Date,
    endDate: Date,
    forLocalUse: boolean
  ) {
    centro.schedules.map(sc => {
      delete sc.clientId;
      delete sc.startTimeInMinutes;
      delete sc.startDaysBeforeNow;
      delete sc.endTimeInMinutes;
      delete sc.endDaysBeforeNow;
      delete sc.isActive;
    });

    const catalogRp = this.conn.getRepository(CatalogOrm);

    const onlyCatalogs: { scheduleId: number; catalogs: CatalogOrm[] }[] = [];

    for (let index = 0; index < centro.schedules.length; index++) {
      const schedule = centro.schedules[index];

      const catalogs = await catalogRp.find({
        where: [
          { clientId: centro.id, scheduleId: schedule.id },
          { clientId: centro.id, scheduleId: IsNull() },
        ],
      });

      onlyCatalogs.push({
        scheduleId: schedule.id,
        catalogs,
      });
    }

    const dieJornadaRp = this.conn.getRepository(DieJornadaOrm);
    const dieSubgrupoRp = this.conn.getRepository(DieSubgrupoOrm);
    const dieEstadoRp = this.conn.getRepository(DieEstadoOrm);

    const horarioIds = centro.schedules.map(el => el.id);

    const dieJornadas = await dieJornadaRp.find({
      where: {
        fecha: Between(getDateToString(startDate), getDateToString(endDate)),
        horarioId: In(horarioIds),
      },
    });
    const dieJornadasIds = dieJornadas.map(el => el.id);

    const dieSubgrupos = await dieSubgrupoRp.find({ where: { dieJornadaId: In(dieJornadasIds) } });
    const dieSubgruposIds = dieSubgrupos.map(el => el.id);

    const dieEstados = await dieEstadoRp.find({
      where: { dieSubgrupoId: In(dieSubgruposIds), isEliminado: false },
    });

    dieSubgrupos.map(s => {
      s.dieJornada = dieJornadas.filter(j => j.id === s.dieJornadaId)[0];
    });

    dieEstados.map(e => {
      e.dieSubgrupo = dieSubgrupos.filter(s => s.id === e.dieSubgrupoId)[0];
    });

    const diets = [];

    dieEstados.forEach(est => {
      if (est.combinacionCode) {
        const codigos = est.combinacionCode.split('|');

        let dieta = '';
        let merienda = '';
        let dietaFamiliar = '';

        const consistencias = [...CONSISTENCIAS_LIQUIDAS, ...CONSISTENCIAS_SOLIDAS];

        codigos.forEach(c => {
          if (MERIENDAS.indexOf(c) < 0 && DIETAS_FAMILIARES.indexOf(c) < 0) {
            if (!dieta) dieta += c;
            else dieta += `|${c}`;
          }

          if (MERIENDAS.indexOf(c) >= 0) merienda = c;
          if (DIETAS_FAMILIARES.indexOf(c) >= 0) dietaFamiliar = c;
        });

        if (dieta && DIETAS_INEXISTENTES.indexOf(dieta) < 0) {
          const hasAnyTipo = () => codigos.some((codigo: string) => TIPOS.includes(codigo));
          const hasAnyConsis = () =>
            codigos.some((consis: string) => consistencias.includes(consis));
          if (hasAnyTipo() && hasAnyConsis()) {
            const newDieta = new DimItdDietOrm();
            newDieta.id = est.id;
            newDieta.dieEstado = est;
            newDieta.dieEstadoId = est.id;
            newDieta.compactConfig = dieta;
            newDieta.value = est.valorDieta;
            newDieta.isReceived = est.dietaRecibida;
            diets.push(newDieta);
          }
        }

        if (merienda) {
          const newMerienda = new DimItdDietOrm();
          newMerienda.id = est.id;
          newMerienda.dieEstado = est;
          newMerienda.dieEstadoId = est.id;
          newMerienda.compactConfig = merienda;
          newMerienda.value = est.valorMerienda;
          newMerienda.isReceived = est.meriendaRecibida;

          diets.push(newMerienda);
        }

        if (dietaFamiliar) {
          const newDieFam = new DimItdDietOrm();
          newDieFam.id = est.id;
          newDieFam.dieEstado = est;
          newDieFam.dieEstadoId = est.id;
          newDieFam.compactConfig = dietaFamiliar;
          newDieFam.value = est.valorDietaFamiliar;
          newDieFam.isReceived = est.dietaFamiliarRecibida;

          diets.push(newDieFam);
        }
      }
    });

    diets.map(d => {
      d.dieEstado = dieEstados.filter(e => e.id === d.dieEstadoId)[0];
    });

    diets.map(diet => {
      const scheduleId = diet.dieEstado.dieSubgrupo.dieJornada.horarioId;
      const onlyCatalog = onlyCatalogs.filter(c => c.scheduleId === scheduleId)[0];
      diet.schedule = centro.schedules.filter(sc => sc.id === scheduleId)[0];
      diet.generateActualConfig(onlyCatalog.catalogs, undefined, true);
      delete diet.config;
      if (!forLocalUse) delete diet.compactConfig;
      else diet.scheduleForHumans = diet.schedule.name;
    });

    return diets;
  }

  public async markAsUnreceived(payload: DietaNoRecibidaDto) {
    const date = new Date(`${payload.date}`).getTime();
    const now = getDateToString(new Date()).getTime();
    const diff = now - date;
    const days = 3;
    if (diff > 86400000 * days) {
      throw new BadRequestException(
        `No se puede reportar dietas no recibidas en jornadas de hace mas de ${days} dia(s)`
      );
    }

    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const centroRp = this.qr.manager.getRepository(CentroOrm);
      const scheduleRp = this.qr.manager.getRepository(ScheduleOrm);
      const dieJornadaRp = this.qr.manager.getRepository(DieJornadaOrm);
      const dieSubgrupoRp = this.qr.manager.getRepository(DieSubgrupoOrm);
      const dieEstadoRp = this.qr.manager.getRepository(DieEstadoOrm);

      const centro = await centroRp.findOne({ where: { id: payload.centroId } });
      if (!centro) throw new BadRequestException('Este centro no existe');

      const schedule = await scheduleRp.findOne({
        where: { id: payload.scheduleId, clientId: payload.centroId },
      });
      if (!schedule) throw new BadRequestException('No existe jornada relacionada con este centro');

      const dieJornadas = await dieJornadaRp.find({
        where: { fecha: payload.date, horarioId: payload.scheduleId },
      });

      const dieJornadasIds = dieJornadas.map(el => el.id);

      const dieSubgrupos = await dieSubgrupoRp.find({
        where: { dieJornadaId: In(dieJornadasIds) },
      });
      const dieSubgruposIds = dieSubgrupos.map(el => el.id);

      const dieEstados = await dieEstadoRp.find({
        where: { dieSubgrupoId: In(dieSubgruposIds), isEliminado: false },
      });

      const diets = [];

      dieEstados.forEach(est => {
        if (est.combinacionCode) {
          const codigos = est.combinacionCode.split('|');

          let dieta = '';
          let merienda = '';
          let dietaFamiliar = '';

          codigos.forEach(c => {
            if (MERIENDAS.indexOf(c) < 0 && DIETAS_FAMILIARES.indexOf(c) < 0) {
              if (!dieta) dieta += c;
              else dieta += `|${c}`;
            }

            if (MERIENDAS.indexOf(c) >= 0) merienda = c;
            if (DIETAS_FAMILIARES.indexOf(c) >= 0) dietaFamiliar = c;
          });

          if (dieta && DIETAS_INEXISTENTES.indexOf(dieta) < 0) {
            const newDieta = new DimItdDietOrm();
            newDieta.id = est.id;
            newDieta.dieEstado = est;
            newDieta.dieEstadoId = est.id;
            newDieta.compactConfig = dieta;
            newDieta.value = est.valorDieta;
            newDieta.isReceived = est.dietaRecibida;

            diets.push(newDieta);
          }

          if (merienda) {
            const newMerienda = new DimItdDietOrm();
            newMerienda.id = est.id;
            newMerienda.dieEstado = est;
            newMerienda.dieEstadoId = est.id;
            newMerienda.compactConfig = merienda;
            newMerienda.value = est.valorMerienda;
            newMerienda.isReceived = est.meriendaRecibida;

            diets.push(newMerienda);
          }

          if (dietaFamiliar) {
            if (!est.dietaFamiliarRecibida) console.log(est);
            const newDieFam = new DimItdDietOrm();
            newDieFam.id = est.id;
            newDieFam.dieEstado = est;
            newDieFam.dieEstadoId = est.id;
            newDieFam.compactConfig = dietaFamiliar;
            newDieFam.value = est.valorDietaFamiliar;
            newDieFam.isReceived = est.dietaFamiliarRecibida;

            diets.push(newDieFam);
          }
        }
      });

      const grouped = groupByKeyExtend({ data: diets, colWithKey: 'compactConfig' });

      const dieConfigs = payload.detail.map(el => el.config);

      for (let index = 0; index < dieConfigs.length; index++) {
        const dieConfig = dieConfigs[index];

        const amount = payload.detail.filter(dt => dt.config === dieConfig)[0].amount;

        let items: DieEstadoOrm[] = [];

        const group = grouped.filter(g => g.key === dieConfig);

        if (group.length) {
          group[0].rows.forEach(l => {
            items.push(l.dieEstado);
          });
        }

        if ([...MERIENDAS, ...DIETAS_FAMILIARES].indexOf(dieConfig) < 0) {
          items.map(i => {
            i.dietaRecibida = true;
          });

          await dieEstadoRp.save(items);

          items.map((d, i) => {
            if (i < amount) d.dietaRecibida = false;
          });

          await dieEstadoRp.save(items);
        }

        if (MERIENDAS.indexOf(dieConfig) >= 0) {
          items.map(i => {
            i.meriendaRecibida = true;
          });

          await dieEstadoRp.save(items);

          items.map((d, i) => {
            if (i < amount) d.meriendaRecibida = false;
          });

          await dieEstadoRp.save(items);
        }

        if (DIETAS_FAMILIARES.indexOf(dieConfig) >= 0) {
          items.map(i => {
            i.dietaFamiliarRecibida = true;
          });

          await dieEstadoRp.save(items);

          items.map((d, i) => {
            if (i < amount) d.dietaFamiliarRecibida = false;
          });

          await dieEstadoRp.save(items);
        }
      }

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public generateDievalues(est: DieEstadoOrm) {
    let diets!: DimItdDietOrm;

    const codigos = est.combinacionCode.split('|');

    let dieta = '';
    let merienda = '';
    let dietaFamiliar = '';

    codigos.forEach(c => {
      if (MERIENDAS.indexOf(c) < 0 && DIETAS_FAMILIARES.indexOf(c) < 0) {
        if (!dieta) dieta += c;
        else dieta += `|${c}`;
      }

      if (MERIENDAS.indexOf(c) >= 0) merienda = c;
      if (DIETAS_FAMILIARES.indexOf(c) >= 0) dietaFamiliar = c;
    });

    if (dieta && DIETAS_INEXISTENTES.indexOf(dieta) < 0) {
      const newDieta = new DimItdDietOrm();
      newDieta.id = est.id;
      newDieta.dieEstado = est;
      newDieta.dieEstadoId = est.id;
      newDieta.compactConfig = dieta;
      newDieta.value = est.valorDieta;
      newDieta.isReceived = est.dietaRecibida;

      diets = newDieta;
    }

    if (merienda) {
      const newMerienda = new DimItdDietOrm();
      newMerienda.id = est.id;
      newMerienda.dieEstado = est;
      newMerienda.dieEstadoId = est.id;
      newMerienda.compactConfig = merienda;
      newMerienda.value = est.valorMerienda;
      newMerienda.isReceived = est.meriendaRecibida;

      diets = newMerienda;
    }

    if (dietaFamiliar) {
      if (!est.dietaFamiliarRecibida) console.log(est);
      const newDieFam = new DimItdDietOrm();
      newDieFam.id = est.id;
      newDieFam.dieEstado = est;
      newDieFam.dieEstadoId = est.id;
      newDieFam.compactConfig = dietaFamiliar;
      newDieFam.value = est.valorDietaFamiliar;
      newDieFam.isReceived = est.dietaFamiliarRecibida;

      diets = newDieFam;
    }

    return diets;
  }
}
